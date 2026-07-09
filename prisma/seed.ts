/**
 * 灵犀数据库种子脚本
 * 
 * 将角色、初始剧情等数据写入数据库
 * 运行: npx prisma db seed (或 npx tsx prisma/seed.ts)
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL || "postgresql://stanleyyou@localhost:5432/linxi?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const characters = [
  {
    id: "xiaoyu",
    name: "林小宇",
    avatar: "👧",
    avatarImg: "/avatars/xiaoyu.png",
    avatarBg: "#FFE4E1",
    tagline: "CS·大四",
    identity: "计算机科学大四",
    briefIntro: "拿到了保研名额，但偷偷面了一家AI创业公司，过了终面。一边是父母期望和稳定学术路，一边是内心热爱和未知风险。",
    personality: "表面开朗爱笑，内心纠结敏感。喜欢用自嘲化解尴尬，偶尔突然说出很有深度的话。",
    speakingStyle: "口语化、爱用emoji、消息短促、偶尔长句输出心里话。",
    age: 22,
    school: "华东理工大学",
    major: "计算机科学与技术",
    signature: "人生就是一场即兴演出 🎬",
    onlineStatus: "在图书馆",
    backgroundImg: "/bgs/xiaoyu-bg.jpg",
    qqId: "2847593016",
    storyStages: [],
    isActive: true,
  },
  {
    id: "haoran",
    name: "陈浩然",
    avatar: "👦",
    avatarImg: "/avatars/haoran.png",
    avatarBg: "#E0EAFF",
    tagline: "金融·研二",
    identity: "金融学研二",
    briefIntro: "和朋友做的量化交易项目开始盈利了。导师催论文，合伙人催全职，女朋友觉得他疑了。",
    personality: "理性表面下藏着冲动，说话直接不绕弯，偶尔自嘲，压力大时会变得很real。",
    speakingStyle: "简洁直接、偶尔爆粗（轻度）、数据思维会不自觉冒出来、深夜聊天会比较真诚。",
    age: 24,
    school: "复旦大学",
    major: "金融工程",
    signature: "数字不会骗人 但人会",
    onlineStatus: "在线",
    backgroundImg: "/bgs/haoran-bg.jpg",
    qqId: "1583672940",
    storyStages: [],
    isActive: true,
  },
  {
    id: "momo",
    name: "苏默默",
    avatar: "🧑",
    avatarImg: "/avatars/momo.png",
    avatarBg: "#FFF3E0",
    tagline: "设计·大三",
    identity: "视觉传达大三",
    briefIntro: "学了三年设计但开始怀疑自己是否真的热爱。最近迷上了写代码做独立产品，觉得打开了新世界。",
    personality: "安静内敛，表达细腻，容易自我怀疑但内心有执着。",
    speakingStyle: "文字温和、用词细腻、很少用emoji、偶尔用省略号表达犹豫。",
    age: 21,
    school: "中国美术学院",
    major: "视觉传达设计",
    signature: "在寻找自己的路上",
    onlineStatus: "离开",
    backgroundImg: "/bgs/momo-bg.jpg",
    qqId: "3296184057",
    storyStages: [],
    isActive: true,
  },
];

async function main() {
  console.log("🌱 Seeding linxi database...");

  // 写入角色
  for (const char of characters) {
    await prisma.character.upsert({
      where: { id: char.id },
      update: char,
      create: char,
    });
    console.log(`  ✅ Character: ${char.name} (${char.id})`);
  }

  // 创建测试用户
  const testUser = await prisma.user.upsert({
    where: { id: "test-user-001" },
    update: {},
    create: {
      id: "test-user-001",
      name: "测试用户",
      city: "深圳",
      interestTags: ["科技", "游戏", "音乐"],
    },
  });
  console.log(`  ✅ Test User: ${testUser.name} (${testUser.id})`);

  // 为测试用户创建初始关系
  for (const char of characters) {
    await prisma.relationship.upsert({
      where: {
        userId_characterId: {
          userId: testUser.id,
          characterId: char.id,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        characterId: char.id,
        familiarity: 0,
        chemistry: 0,
        stage: "陌生",
      },
    });
    console.log(`  ✅ Relationship: ${testUser.name} ↔ ${char.name}`);
  }

  console.log("\n🎉 Seed completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
