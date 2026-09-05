import { algorithmLessons } from "./algorithms";
import { foundationLessons } from "./foundations";
import { systemLessons } from "./systems";
import { networkLessons } from "./networks";
import { learningLessons } from "./learning";
import { Lesson } from "./model";
export const lessons: Record<string, Lesson> = {
  ...algorithmLessons,
  ...foundationLessons,
  ...systemLessons,
  ...networkLessons,
  ...learningLessons,
};
