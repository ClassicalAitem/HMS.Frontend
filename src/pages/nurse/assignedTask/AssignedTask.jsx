import React from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/nurse/dashboard/Sidebar";
import { TASK } from "../../../../data";
import { useState } from "react";

const AssignedTask = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState(TASK);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  //function to toggle
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  // Toggle task completion
  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };
  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <section>
            <div className="w-[225px]">
              <h1 className="text-[24px] text-base-content">Assigned Task</h1>
              <p className="text-[12px] text-base-content/70">Tuesday, September 9, 2025</p>
            </div>

            <div className="flex h-[773px] gap-10 bg-base-200 p-6 mt-6">
              {/* Task list */}

              <div className=" w-[1108px] bg-base-100 shadow p-10">
                <div className="">
                  <div className="flex  justify-between items-center mb-4">
                    <h2 className="font-[400] text-[24px] text-base-content">Registered Tasks</h2>
                    <p className="text-[12px] text-base-content/70">
                      Last Updated 1/1/01 12:00AM
                    </p>
                  </div>

                  {/* Task Items */}

                  <div>
                    <ul className="flex flex-col gap-10">
                      {tasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex justify-between items-center"
                        >
                          <div className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTask(task.id)}
                              className="w-4 h-4 rounded accent-primary focus:ring-primary"
                            />
                            
                            <span>{task.title}</span>
                          </div>
                          <span className="text-sm text-base-content/70">
                            {task.time}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-7">
                <div className="bg-base-100 w-[350px] h-[176px]  rounded-[6px] shadow p-4">
                  <h3 className="text-sm text-base-content">Total Tasks</h3>
                  <p className="text-[40px] font-bold py-5">{totalTasks}</p>
                  <p className="text-xs text-base-content/70">
                    Active under your care
                  </p>
                </div>

                <div className="bg-base-100 w-[350px] h-[176px]  rounded-[6px] shadow p-4">
                  <h3 className="text-sm text-base-content">Completed Task</h3>
                  <p className="text-[40px] font-bold py-5">{completedTasks}</p>
                  <p className="text-xs text-base-content/70">
                    {completedTasks} Completed
                  </p>
                </div>

                <button className="w-full border rounded-lg py-2 text-base-content">
                  + Create Task
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AssignedTask;
