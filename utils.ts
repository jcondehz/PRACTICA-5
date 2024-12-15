import {Student,StudentModel,Teacher,TeacherModel,Course,CourseModel} from "./types.ts";

import { Collection,ObjectId } from "mongodb";

// Convert a CourseModel to a Course
export function fromCourseModelToCourse(model: CourseModel): Course {
  return {
    id: model._id?.toString()|| "", 
    title: model.title,
    description: model.description,
    teacher_id: model.teacher_id.toString(), 
    students: model.students.map(student => student.toString()), 
  };
}

// Convert a StudentModel to a Student
export function fromStudentModelToStudent(model: StudentModel): Student {
  return {
    id: model._id?.toString() || "", 
    name: model.name,
    email: model.email,
    enrolledCourses: model.enrolledCourses.map(course => course.toString()), 
  };
}

// Convert a TeacherModel to a Teacher
export function fromTeacherModelToTeacher(model: TeacherModel): Teacher {
  return {
    id: model._id?.toString() || "", 
    name: model.name,
    email: model.email,
    coursesTaught: model.coursesTaught.map(course => course.toString()), 
  };
}




