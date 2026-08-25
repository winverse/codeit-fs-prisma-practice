import { prisma } from '../src/db/prisma.js';
import {
  PRACTICE_RESET_CONFIRMATION,
  resetPracticeDatabase,
} from '../src/db/practice-database.js';

try {
  if (!process.argv.includes(PRACTICE_RESET_CONFIRMATION)) {
    throw new Error(`${PRACTICE_RESET_CONFIRMATION} 확인 인자가 필요합니다.`);
  }

  await resetPracticeDatabase(prisma, PRACTICE_RESET_CONFIRMATION);
  console.log('prisma_practice_blog의 practice 데이터를 초기화했습니다.');
} finally {
  await prisma.$disconnect();
}
