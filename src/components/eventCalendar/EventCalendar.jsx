import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export const Events = [
  {
    id: 1,
    title: 'lorem Ipsum dolor',
    time: '12:00 PM - 2:00 PM',
    desc: 'Lorem ipsum dolor sit amet, consecteur adipisicing elit.'
  },
  {
    id: 2,
    title: 'lorem Ipsum dolor',
    time: '12:00 PM - 2:00 PM',
    desc: 'Lorem ipsum dolor sit amet, consecteur adipisicing elit.'
  },
  {
    id: 3,
    title: 'lorem Ipsum dolor',
    time: '12:00 PM - 2:00 PM',
    desc: 'Lorem ipsum dolor sit amet, consecteur adipisicing elit.'
  }
];

export const EventCalendar = () => {
  const [value, setValue] = useState(new Date());
  return (
    <div className="bg-white rounded-lg p-4">
      <Calendar onChange={setValue} value={value} />
    </div>
  );
};

export const Activities = ({ title }) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold my-4">{title}</h1>
        <img src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <div className="flex flex-col gap-4">
        {Events.map((event) => (
          <div
            className="p-5 rounded-md ring-2 ring-dark-gray border-t-4 odd:border-t-green even:border-t-dark-gray"
            key={event.id}
          >
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-dark-gray">{event.title}</h1>
              <span className="text-xs text-gray">{event.time}</span>
            </div>
            <p className="mt-2 text-dark-gray text-sm">{event.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default EventCalendar;
