//PRACTICA 5 JUAN CARLOS 03-12-2024

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "npm:@apollo/server/standalone";
import { MongoClient } from "mongodb";
import { CourseModel, StudentModel, TeacherModel } from "./types.ts";
import { schema } from "./schema.ts";
import { resolvers } from "./resolvers.ts";

const MONGO_URL =
  Deno.env.get("MONGO_URL") ;
if (!MONGO_URL) {
  console.error("MONGO URL API KEY NOT WORKING");
  Deno.exit(1);
}

const dbuser = new MongoClient(MONGO_URL);
await dbuser.connect();
console.info("Connected to MongoDB");

const db = dbuser.db("Course-Management");
const studentCollection = db.collection<StudentModel>("Student");
const teacherCollection = db.collection<TeacherModel>("Teacher");
const courseCollection = db.collection<CourseModel>("Course");

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  context: async () => (await {
    studentCollection,
    teacherCollection,
    courseCollection
  }),
  listen: { port: 8080 },
});

console.info(`Server ready at ${url}`);
