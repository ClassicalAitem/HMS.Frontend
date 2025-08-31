import React from 'react';

const UserCard = ({ title, subTitle, value, icon: Icon, bgColor, iconColor }) => {
  return (
    <div className="relative w-full border transition-all duration-300 rounded-2xl border-gray bg-white p-4 flex-1 min-w-[200px] shadow-sm">
      <div className="flex justify-between items-center">
        <span className="font-heading text-2xs font-medium leading-tight text-dark-gray mb-1 capitalize">
          {subTitle}
        </span>
        <div
          className={`w-7 h-7 flex items-center justify-center rounded-md p-1 cursor-pointer ${bgColor}`}
        >
          {Icon && <Icon className={iconColor} />}
        </div>
      </div>
      <h1 className="text-lg font-medium my-1">{value}</h1>
      <h2 className="capitalize text-sm font-light">{title}</h2>
    </div>
  );
};

export default UserCard;
