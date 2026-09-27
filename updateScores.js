const admin = require('firebase-admin');

// Firebase Admin SDK 초기화 (서비스 계정 키 필요)
const serviceAccount = require('./path/to/serviceAccountKey.json'); // 서비스 계정 키 파일 경로
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://your-project-id.firebaseio.com" // 본인의 Firebase 프로젝트 URL로 변경
});

const database = admin.database();
const databaseRef = database.ref('results');

// 점수 계산 함수 (로그 스케일 주파수 차이 기반)
function calculateScore(referenceFrequency, adjustableFrequency) {
    const logDiff = Math.abs(Math.log2(referenceFrequency) - Math.log2(adjustableFrequency));
    const score = Math.max(0, 100 - (logDiff / 0.5) * 100);
    return score;
}

databaseRef.once('value')
    .then((snapshot) => {
        const updates = {};
        snapshot.forEach((childSnapshot) => {
            const result = childSnapshot.val();

            // 로그 스케일 점수 계산 (logScaleScore 변수 선언 및 할당)
            const logScaleScore = parseFloat(calculateScore(result.referenceFrequency, result.adjustableFrequency).toFixed(2));

            // 기존 점수와 로그 스케일 기반 점수가 다를 경우 업데이트
            if (result.score !== logScaleScore) {
                updates[`/${childSnapshot.key}/score`] = logScaleScore;
            }
        });

        // 업데이트가 필요한 경우에만 일괄 업데이트 실행
        if (Object.keys(updates).length > 0) {
            return databaseRef.update(updates);
        } else {
            console.log('업데이트할 데이터가 없습니다.');
            return Promise.resolve(); // 빈 Promise 반환
        }
    })
    .then(() => {
        console.log('점수 업데이트 완료');
        process.exit();
    })
    .catch((error) => {
        console.error('오류:', error);
        process.exit(1);
    });
