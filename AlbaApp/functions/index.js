const functions = require('firebase-functions');
const admin = require('firebase-admin');
const QRCode = require('qrcode');

admin.initializeApp();

// Generate QR code and store in Firebase Storage
exports.generateQRCode = functions.https.onCall(async (data, context) => {
  try {
    // For development, allow unauthenticated requests
    // In production, you should require authentication
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    // }

    console.log('Received data:', JSON.stringify(data, null, 2));
    
    const { memberId, memberData } = data;
    
    if (!memberId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing memberId');
    }
    
    if (!memberData) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing memberData');
    }
    
    if (!memberData.qrCodeHash) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing qrCodeHash in memberData');
    }
    
    if (!memberData.name) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing name in memberData');
    }
    
    if (!memberData.accessLevel) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing accessLevel in memberData');
    }

    // Create QR code data
    const qrData = JSON.stringify({
      id: memberId,
      qrCodeHash: memberData.qrCodeHash,
      name: memberData.name,
      accessLevel: memberData.accessLevel,
      timestamp: new Date().toISOString(),
      expiry: memberData.qrCodeExpiry ? new Date(memberData.qrCodeExpiry).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    console.log('Generating QR code for data:', qrData);

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log('QR code generated successfully');

    // Convert data URL to buffer
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Store QR code in Firebase Storage
    const bucket = admin.storage().bucket();
    const fileName = `qr-codes/${memberId}_${Date.now()}.png`;
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        metadata: {
          memberId: memberId,
          generatedAt: new Date().toISOString()
        }
      }
    });

    console.log('QR code saved to storage:', fileName);

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    console.log('Public URL generated:', publicUrl);

    // Store QR code metadata in Firestore
    await admin.firestore().collection('qrCodes').doc(memberId).set({
      memberId: memberId,
      qrCodeHash: memberData.qrCodeHash,
      imageUrl: publicUrl,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: memberData.qrCodeExpiry ? new Date(memberData.qrCodeExpiry) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: true
    });

    console.log('QR code metadata saved to Firestore');

    return {
      success: true,
      qrCodeUrl: publicUrl,
      qrCodeData: qrData
    };

  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new functions.https.HttpsError('internal', `Failed to generate QR code: ${error.message}`);
  }
});

// Validate QR code
exports.validateQRCode = functions.https.onCall(async (data, context) => {
  try {
    const { qrCodeHash } = data;
    
    if (!qrCodeHash) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing QR code hash');
    }

    // Find member by QR code hash
    const membersRef = admin.firestore().collection('members');
    const query = await membersRef.where('qrCodeHash', '==', qrCodeHash).get();

    if (query.empty) {
      return {
        valid: false,
        message: 'Invalid QR code'
      };
    }

    const memberDoc = query.docs[0];
    const memberData = memberDoc.data();

    // Check if QR code is expired
    const now = new Date();
    const expiryDate = memberData.qrCodeExpiry.toDate();
    
    if (now > expiryDate) {
      return {
        valid: false,
        message: 'QR code expired',
        memberData: memberData
      };
    }

    // Log access attempt
    await admin.firestore().collection('accessLogs').add({
      memberId: memberDoc.id,
      memberName: memberData.name,
      accessTime: admin.firestore.FieldValue.serverTimestamp(),
      qrCodeHash: qrCodeHash,
      accessGranted: true,
      guardId: context.auth ? context.auth.uid : null
    });

    return {
      valid: true,
      message: 'Access granted',
      memberData: memberData
    };

  } catch (error) {
    console.error('Error validating QR code:', error);
    throw new functions.https.HttpsError('internal', 'Failed to validate QR code');
  }
});

// Get QR code for member
exports.getMemberQRCode = functions.https.onCall(async (data, context) => {
  try {
    // For development, allow unauthenticated requests
    // In production, you should require authentication
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    // }

    const { memberId } = data;
    
    if (!memberId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing member ID');
    }

    // Get QR code from Firestore
    const qrCodeDoc = await admin.firestore().collection('qrCodes').doc(memberId).get();
    
    if (!qrCodeDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'QR code not found');
    }

    const qrCodeData = qrCodeDoc.data();
    
    return {
      success: true,
      qrCodeUrl: qrCodeData.imageUrl,
      generatedAt: qrCodeData.generatedAt,
      expiresAt: qrCodeData.expiresAt
    };

  } catch (error) {
    console.error('Error getting member QR code:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get QR code');
  }
});
