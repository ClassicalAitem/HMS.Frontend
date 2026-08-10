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
    <div className="flex min-h-screen w-full">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[280px] transform transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-5 lg:p-6">
          <section className="space-y-5">
            <div className="max-w-fit">
              <h1 className="text-2xl font-bold text-base-content sm:text-3xl">Assigned Task</h1>
              <p className="text-xs text-base-content/70 sm:text-sm">Tuesday, September 9, 2025</p>
            </div>

            <div className="grid gap-5 rounded-box bg-base-200 p-3 sm:p-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.7fr)] xl:gap-6">
              <div className="w-full rounded-box bg-base-100 p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-semibold text-base-content sm:text-2xl">Registered Tasks</h2>
                  <p className="text-xs text-base-content/70 sm:text-sm">
                    Last Updated 1/1/01 12:00AM
                  </p>
                </div>

                <ul className="flex flex-col gap-4 sm:gap-6">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex flex-col gap-2 border-b border-base-200 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="h-4 w-4 rounded accent-primary focus:ring-primary"
                        />
                        <span className="text-sm sm:text-base">{task.title}</span>
                      </div>
                      <span className="text-xs text-base-content/70 sm:text-sm">{task.time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-4 xl:gap-5">
                <div className="rounded-box bg-base-100 p-4 shadow-sm sm:p-5">
                  <h3 className="text-sm text-base-content">Total Tasks</h3>
                  <p className="py-4 text-3xl font-bold sm:text-4xl">{totalTasks}</p>
                  <p className="text-xs text-base-content/70">Active under your care</p>
                </div>

                <div className="rounded-box bg-base-100 p-4 shadow-sm sm:p-5">
                  <h3 className="text-sm text-base-content">Completed Task</h3>
                  <p className="py-4 text-3xl font-bold sm:text-4xl">{completedTasks}</p>
                  <p className="text-xs text-base-content/70">{completedTasks} Completed</p>
                </div>

                <button className="w-full rounded-lg border border-base-300 bg-base-100 py-2.5 text-base-content transition hover:bg-base-200">
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
