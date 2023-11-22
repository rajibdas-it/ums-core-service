/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { RedisClient } from '../../../shared/redis';
import { Event_Student_Created } from './student.constant';
import { studentService } from './student.service';

const userEvents = () => {
  RedisClient.subscribe(Event_Student_Created, async e => {
    const data = JSON.parse(e);
    // console.log(data);
    await studentService.createStudentFromEvent(data);
    // console.log(data);
  });
};

export default userEvents;
