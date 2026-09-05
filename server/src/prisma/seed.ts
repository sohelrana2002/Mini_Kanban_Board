import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing all data and resetting IDs to start from 1");

  await prisma.task.deleteMany({});
  await prisma.boardMember.deleteMany({});
  await prisma.column.deleteMany({});
  await prisma.board.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("Database cleared and sequences reset to 1.");

  const passwordHash = await bcrypt.hash("123456", 10);

  const user1 = await prisma.user.create({
    data: {
      email: "sohel@test.com",
      password: passwordHash,
      name: "Sohel Rana",
    },
  });
  const user2 = await prisma.user.create({
    data: {
      email: "fahim@test.com",
      password: passwordHash,
      name: "Fahim Rahman",
    },
  });
  const user3 = await prisma.user.create({
    data: {
      email: "rashed@test.com",
      password: passwordHash,
      name: "Rashed Hasan",
    },
  });
  const user4 = await prisma.user.create({
    data: {
      email: "akib@test.com",
      password: passwordHash,
      name: "Akib Ahmed",
    },
  });
  const user5 = await prisma.user.create({
    data: {
      email: "sabit@test.com",
      password: passwordHash,
      name: "Sabit Raihan",
    },
  });
  const user6 = await prisma.user.create({
    data: {
      email: "showrab@test.com",
      password: passwordHash,
      name: "Showrab Kormokar",
    },
  });
  const user7 = await prisma.user.create({
    data: {
      email: "sakib@test.com",
      password: passwordHash,
      name: "Nazmus Sakib",
    },
  });

  console.log("All user created successfully");

  const board1 = await prisma.board.create({
    data: {
      title: "Project Alpha - Main Board",
      ownerId: user1.id,
    },
  });
  console.log(`Board 1 created by User 1 (ID: ${board1.id})`);

  await prisma.boardMember.createMany({
    data: [
      { boardId: board1.id, userId: user2.id },
      { boardId: board1.id, userId: user3.id },
      { boardId: board1.id, userId: user4.id },
      { boardId: board1.id, userId: user5.id },
      { boardId: board1.id, userId: user6.id },
    ],
  });
  console.log("4 members added to Board 1");

  const col1 = await prisma.column.create({
    data: { title: "To Do", order: 0, boardId: board1.id },
  });
  const col2 = await prisma.column.create({
    data: { title: "In Progress", order: 1, boardId: board1.id },
  });
  const col3 = await prisma.column.create({
    data: { title: "Done", order: 2, boardId: board1.id },
  });
  console.log("3 Columns created for Board 1");

  await prisma.task.create({
    data: {
      title: "Design UI Mockups",
      description: "Figma design for Kanban board",
      position: 0,
      columnId: col1.id,
      assigneeId: user2.id,
    },
  });
  await prisma.task.create({
    data: {
      title: "Write Test Cases",
      description: "Tests for moveTask API",
      position: 1,
      columnId: col1.id,
      assigneeId: user3.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Implement Drag & Drop",
      description: "Frontend DnD integration with API",
      position: 0,
      columnId: col2.id,
      assigneeId: user4.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Setup Database Schema",
      description: "Prisma models & migrations",
      position: 0,
      columnId: col3.id,
      assigneeId: user1.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Deploy Backend Service",
      description: "Docker & Cloud deployment",
      position: 1,
      columnId: col3.id,
      assigneeId: user5.id,
    },
  });
  console.log("5 Tasks created in Board 1");

  const board2 = await prisma.board.create({
    data: {
      title: "Project Beta - Secondary Board",
      ownerId: user6.id,
    },
  });
  console.log("Board 2 created by User 6");

  await prisma.boardMember.createMany({
    data: [
      { boardId: board2.id, userId: user1.id },
      { boardId: board2.id, userId: user7.id },
    ],
  });
  console.log("User 1 & 7 added as member of Board 2");

  const col4 = await prisma.column.create({
    data: { title: "Backlog", order: 0, boardId: board2.id },
  });
  const col5 = await prisma.column.create({
    data: { title: "Doing", order: 1, boardId: board2.id },
  });
  const col6 = await prisma.column.create({
    data: { title: "Review", order: 2, boardId: board2.id },
  });
  console.log("3 Columns created for Board 2");

  await prisma.task.create({
    data: {
      title: "Initialize Project Beta",
      description: "Setup repo and env",
      position: 0,
      columnId: col4.id,
      assigneeId: user1.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Write Documentation",
      description: "README and API docs",
      position: 0,
      columnId: col6.id,
      assigneeId: user6.id,
    },
  });
  console.log("2 Tasks created in Board 2");

  console.log("Seeding completed successfully");
  console.log("Log in with: sohel@test.com / 123456 ");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
