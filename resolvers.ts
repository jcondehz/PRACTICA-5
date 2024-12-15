import { Collection, ObjectId } from "mongodb";
import {Student,StudentModel,Teacher,TeacherModel,Course,CourseModel} from "./types.ts";


type context = {
  studentCollection: Collection<StudentModel>;
  teacherCollection: Collection<TeacherModel>;
  courseCollection: Collection<CourseModel>;
};

// GraphQL Resolvers
export const resolvers = { 
  Query: {
    students: async (_: unknown, __: unknown, ctx: context): Promise<StudentModel[]> => {return await ctx.studentCollection.find().toArray()},
    student : async (_: unknown, args : {id: string}, ctx: context): Promise<StudentModel|null> => {
        const studentDB = await ctx.studentCollection.findOne({_id: new ObjectId(args.id)});
        if (!studentDB) return null;
        return studentDB;
    },
    teachers: async (_: unknown, __: unknown, ctx: context): Promise<TeacherModel[]> => {return await ctx.teacherCollection.find().toArray()},
    teacher : async (_: unknown, args : {id: string}, ctx: context): Promise<TeacherModel|null> => {
        const teacherDB = await ctx.teacherCollection.findOne({_id: new ObjectId(args.id)});
        if (!teacherDB) return null;
        return teacherDB;
    },
    courses: async (_: unknown, __: unknown, ctx: context): Promise<CourseModel[]> => {return await ctx.courseCollection.find().toArray()},
    course : async (_: unknown, args : {id: string}, ctx: context): Promise<CourseModel|null> => {
        const courseDB = await ctx.courseCollection.findOne({_id: new ObjectId(args.id)});
        if (!courseDB) return null;
        return courseDB;
    },
},

Mutation: {
  createStudent: async (_: unknown, args: { name: string, email: string}, ctx: context): Promise<StudentModel> => {
      const { insertedId } = await ctx.studentCollection.insertOne({...args, enrolledCourses: []});
      return {
          _id: insertedId,
          ...args,
          enrolledCourses: [],
      };
  },
  createTeacher: async (_: unknown, args: { name: string, email: string}, ctx: context): Promise<TeacherModel> => {
      const { insertedId } = await ctx.teacherCollection.insertOne({...args, coursesTaught: []});
      return {
          _id: insertedId,
          ...args,
          coursesTaught: [],
      }
  },
  createCourse: async (_: unknown, args: { title: string, description: string, teacher_id: string}, ctx: context): Promise<CourseModel> => {
      const teacher = await ctx.teacherCollection.find({_id: new ObjectId(args.teacher_id)});
      if (!teacher) throw new Error("Teacher Id not found");
      const { insertedId } = await ctx.courseCollection.insertOne({
          title: args.title,
          description: args.description,
          teacher_id: new ObjectId(args.teacher_id),
          students: [],
      });
      return {
          _id: insertedId,
          title: args.title,
          description: args.description,
          teacher_id: new ObjectId(args.teacher_id),
          students: [],
      };
  },
  deleteStudent: async (_: unknown, args: {id: string}, ctx: context): Promise<boolean> => {
      const studentModel = await ctx.studentCollection.findOneAndDelete({_id: new ObjectId(args.id)});
      if (!studentModel) return false;
      await ctx.courseCollection.updateMany({students: new ObjectId(args.id)},{ $pull: {studentIds: new ObjectId(args.id)}});
      return true;
  },
  deleteTeacher: async (_:unknown, args: {id:string}, ctx: context): Promise<boolean> => {
      const myTeacher = await ctx.teacherCollection.findOneAndDelete({_id:new ObjectId(args.id)});
      if(!myTeacher) return false;
      await ctx.courseCollection.updateMany({teacher_id: new ObjectId(args.id)},{ $set: { teacherid: null}});
      return true;
  },
  deleteCourse: async (_:unknown, args: {id:string}, ctx: context): Promise<boolean> => {
      const myCourse = await ctx.courseCollection.findOneAndDelete({_id:new ObjectId(args.id)});
      if(!myCourse){return false;}
      await ctx.teacherCollection.updateMany({coursesTaught:new ObjectId(args.id)},{$pull:{coursesTaught:new ObjectId(args.id)}})
      await ctx.studentCollection.updateMany({enrolledCourses:new ObjectId(args.id)},{$pull:{enrolledCourses:new ObjectId(args.id)}})
      return true;
  },
  updateStudent: async (_:unknown, args: {id: string, name?: string, email?: string}, ctx: context): Promise<StudentModel|null> => {
      await ctx.studentCollection.updateOne({_id: new ObjectId(args.id)},
          { $set: { ...(args.name && { name: args.name }), ...(args.email && { email: args.email })}})
      const studentDB = await ctx.studentCollection.findOne({_id: new ObjectId(args.id)}); 
      if(!studentDB) { return null; }
      return studentDB;
  },
  updateTeacher: async (_:unknown,args:{id: string, name?: string, email?: string}, ctx: context): Promise<TeacherModel|null> => {
      await ctx.teacherCollection.updateOne({_id:new ObjectId(args.id)},
      { $set: { ...(args.name && { name: args.name }), ...(args.email && { email: args.email })}})
      const teacherDB = await ctx.teacherCollection.findOne({_id:new ObjectId(args.id)});
      if(!teacherDB) { return null; }
      return teacherDB;
  },
  updateCourse: async (_: unknown, args: { id: string; title?: string; description?: string; teacher_id?: string }, ctx: context): Promise<CourseModel|null> => {
      await ctx.courseCollection.updateOne(
          { _id: new ObjectId(args.id) },
          {$set: {...(args.title && { title: args.title }),
                  ...(args.description && { description: args.description }),
                  ...(args.teacher_id && { teacher_id: new ObjectId(args.teacher_id) })}});      
      const myCourse = await ctx.courseCollection.findOne({_id: new ObjectId(args.id)});
      if (!myCourse) { return null; }
      return myCourse;
  },
  enrollStudentInCourse: async (_:unknown, args:{studentId: string, courseId: string}, ctx: context): Promise<CourseModel|null> => {
      const myStudent = await ctx.studentCollection.findOne({_id:new ObjectId(args.studentId)})
      const myCourse = await ctx.courseCollection.findOne({_id:new ObjectId(args.courseId)});
      if(!myStudent || !myCourse){ return null; }

      const student = myCourse.students
      const exist = student.some((u) => myStudent._id === u)
      if(exist){ return myCourse}

      await ctx.studentCollection.updateOne({_id: new ObjectId(args.studentId)},{$push: {enrolledCourses: new ObjectId(args.courseId)}})
      await ctx.courseCollection.updateOne({_id: new ObjectId(args.courseId)},{$push: {studentIds: new ObjectId(args.studentId)}})
      const course = await ctx.courseCollection.findOne({_id: new ObjectId(args.courseId)})
      return course;
  },
  removeStudentFromCourse:async(_:unknown, args:{studentId: string, courseId: string}, ctx: context): Promise<CourseModel|null> => {
      const myStudent = await ctx.studentCollection.findOne({_id:new ObjectId(args.studentId)})
      const myCourse = await ctx.courseCollection.findOne({_id:new ObjectId(args.courseId)});
      if(!myStudent || !myCourse){ return null; }

      await ctx.courseCollection.updateOne({_id: new ObjectId(args.courseId) },{$pull: { enrolledStudents: args.studentId }});  
      await ctx.studentCollection.updateOne({_id: new ObjectId(args.studentId) },{$pull: {enrolledCourses:args.courseId}});
      const course = await ctx.courseCollection.findOne({_id:new ObjectId(args.courseId)});
      return course;
  },
},

Student: {
  id: (parent: StudentModel): string => parent._id!.toString(),
  enrolledCourses: async (parent: StudentModel, _: unknown, ctx: context): Promise<CourseModel[]> => {
      const enrolledCourses = await ctx.courseCollection.find({_id:{$in:parent.enrolledCourses}}).toArray();
      return enrolledCourses;
  }
},
Teacher: {
  id: (parent: TeacherModel): string => parent._id!.toString(),
  coursesTaught: async (parent: TeacherModel, _: unknown, ctx: context): Promise<CourseModel[]> => {
      const enrolledCourses = await ctx.courseCollection.find({_id:{$in:parent.coursesTaught}}).toArray();
      return enrolledCourses;
  }
},
Course: {
  id: (parent: CourseModel): string => parent._id!.toString(),
  teacher_id: async (parent: CourseModel,  _: unknown, ctx: context): Promise<TeacherModel|null> => {
      if(parent.teacher_id === null){ return null; }
      const teacher = await ctx.teacherCollection.findOne({_id:parent.teacher_id});
      return teacher;
  },
  students: async (parent: CourseModel,  _: unknown, ctx: context): Promise<StudentModel[]> => {
      const studentIds = await ctx.studentCollection.find({_id:{$in:parent.students}}).toArray();
      return studentIds;
  }
}
}