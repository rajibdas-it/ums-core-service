import { RedisClient } from '../../../shared/redis';
import { Event_Student_Created } from './student.constant';

const userEvents = () => {
  RedisClient.subscribe(Event_Student_Created, async e => {
    const data = JSON.parse(e);
    console.log(data);
  });
};

export default userEvents;
