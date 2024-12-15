import {ObjectId, OptionalId} from "mongodb";

export type Student = {
  id: string;
  name:string;
  email:string;
  enrolledCourses: string[];
}

export type StudentModel = OptionalId<{
  name: string;
  email: string;
  enrolledCourses: ObjectId[];
}>;

export type Teacher = {
  id: string;
  name:string;
  email:string;
  coursesTaught: string[];
}

export type TeacherModel = OptionalId<{
  name: string;
  email: string;
  coursesTaught: ObjectId[];
}>;

export type Course = {
  id:string;
  title:string;
  description:string;
  teacher_id:string;
  students:string[];
}

export type CourseModel = OptionalId<{
  title: string;
  description: string;
  teacher_id: ObjectId;
  students: ObjectId[];
}>


