import * as R from "runtypes";

export interface ScheduleEntry {
    entry_type: string;
    id: string;
    title: string;
    sql_date: string;
    start: string;
    end: string;
    param_1: string;
    param_2: string;
    allDay: boolean;
    teacher_name_list: string;
    room_id: string;
    course_diary_id: string;
    period_id: string;
    color: string;
    textColor: string;
}

export const HtmlString = R.Record({
    __html: R.String
});

export type HtmlStringType = R.Static<typeof HtmlString>;

export const ExerciseDetail = R.Record({
    course: R.String,
    title: R.String,
    type: R.String,
    due: R.String,
    generalComment: HtmlString,
    grade: R.String,
    status: R.String,
    supportingComment: HtmlString
});

export type ExerciseDetailType = R.Static<typeof ExerciseDetail>;
