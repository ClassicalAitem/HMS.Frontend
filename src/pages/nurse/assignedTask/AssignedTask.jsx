import React, { useState, useEffect } from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/nurse/dashboard/Sidebar";
import taskAPI from "@/services/api/taskAPI";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";

const AssignedTask = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskToComplete, setTaskToComplete] = useState(null);

  const nurseName = user?.firstName && user?.lastName 
    ? `Nurse ${user.firstName} ${user.lastName}` 
    : "Nurse";

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await taskAPI.getAllTasks({ assignedToRole: "nurse" });
      const tasksData = res?.data?.data ?? res?.data ?? [];
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  //function to toggle
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  // Handle checkbox change
  const handleCheckboxChange = async (task) => {
    if (task.completed) {
      try {
        await taskAPI.updateTask(task.id, { completed: false });
        fetchTasks();
      } catch (error) {
        toast.error("Failed to uncheck task");
      }
    } else {
      setTaskToComplete(task);
    }
  };

  const confirmCompletion = async () => {
    if (!taskToComplete) return;
    try {
      const now = new Date().toLocaleString();
      const updatedDetails = {
        ...(taskToComplete.details || {}),
        completedAt: now,
        completedBy: nurseName,
      };
      
      await taskAPI.updateTask(taskToComplete.id, { 
        completed: true, 
        details: updatedDetails 
      });
      toast.success("Task completed!");
      setTaskToComplete(null);
      fetchTasks();
    } catch (error) {
      toast.error("Failed to complete task");
    }
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

                {loading ? (
                  <div className="py-12 flex justify-center items-center">
                    <span className="loading loading-spinner text-primary loading-md"></span>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="py-8 text-center text-base-content/50">
                    <p className="text-sm font-medium">No tasks found</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-4 sm:gap-6">
                    {tasks.map((task) => {
                      const patientName = task.dependant
                        ? `${task.dependant.firstName || ""} ${task.dependant.lastName || ""}`.trim()
                        : task.patient 
                        ? `${task.patient.firstName || ""} ${task.patient.lastName || ""}`.trim() 
                        : null;

                      return (
                        <li
                          key={task.id}
                          className={`flex flex-col gap-2 border-b border-base-200 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between ${
                            task.completed ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => handleCheckboxChange(task)}
                              className="h-4 w-4 mt-1 rounded accent-primary focus:ring-primary"
                            />
                            <div className="flex flex-col">
                              <span className={`text-sm sm:text-base ${task.completed ? "line-through text-base-content/50" : ""}`}>
                                {task.title}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                {patientName && (
                                  <span className="text-xs bg-base-200 px-2 py-0.5 rounded-full text-base-content/70">
                                    {patientName}
                                  </span>
                                )}
                                {task.details?.priority === "Urgent" && (
                                  <span className="text-xs bg-error/10 text-error px-2 py-0.5 rounded-full font-bold">
                                    Urgent
                                  </span>
                                )}
                                <span className="text-xs text-base-content/70">
                                  {task.details?.category || "General"}
                                </span>
                              </div>
                              {task.completed && task.details?.completedBy && (
                                <div className="text-xs font-medium text-base-content/60 mt-1.5 flex items-center gap-1">
                                  <span>✓ Completed by {task.details.completedBy}</span>
                                  <span>•</span>
                                  <span>{task.details.completedAt}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {task.dueTime && (
                            <span className="text-xs font-semibold text-primary sm:text-sm">
                              Due: {task.dueTime}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
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
              </div>
            </div>
          </section>
        </div>
      </div>
      {/* Completion Modal */}
      {taskToComplete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md bg-base-100 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-base-200">
              <h3 className="font-bold text-lg text-base-content">
                Confirm Task Completion
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-base-content/70">Task</p>
                <p className="text-base-content font-medium">{taskToComplete.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-base-content/70">Completed By</p>
                  <p className="text-base-content font-medium">{nurseName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-base-content/70">Time & Date</p>
                  <p className="text-base-content font-medium">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-base-200 flex justify-end gap-2 bg-base-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setTaskToComplete(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmCompletion}
                className="btn btn-primary text-white"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedTask;
