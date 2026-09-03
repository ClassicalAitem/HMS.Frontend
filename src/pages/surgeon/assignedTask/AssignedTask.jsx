import React, { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/surgeon/dashboard/Sidebar";
import {
  FaCheckCircle,
  FaPlus,
  FaTrash,
  FaCalendarAlt,
  FaClipboardList,
  FaClock,
  FaExclamationCircle,
} from "react-icons/fa";
import { RiMentalHealthFill } from "react-icons/ri";
import toast from "react-hot-toast";

const INITIAL_SURGICAL_TASKS = [
  {
    id: "task-1",
    title: "Verify pre-op anesthesia clearance and informed consent for Theater 1",
    category: "Pre-Operative",
    priority: "High",
    dueTime: "08:30 AM",
    completed: false,
  },
  {
    id: "task-2",
    title: "Review blood cross-match and emergency packed RBC reserves with Blood Bank",
    category: "Theatre Prep",
    priority: "Urgent",
    dueTime: "09:00 AM",
    completed: true,
  },
  {
    id: "task-3",
    title: "Complete WHO Surgical Safety Checklist (Sign-in / Time-out / Sign-out)",
    category: "Intra-Operative",
    priority: "High",
    dueTime: "10:15 AM",
    completed: false,
  },
  {
    id: "task-4",
    title: "Dispatch surgical pathology specimens with request forms to Histopathology",
    category: "Post-Operative",
    priority: "Normal",
    dueTime: "01:30 PM",
    completed: false,
  },
  {
    id: "task-5",
    title: "Post-operative surgical ward rounds: check surgical drains & vitals",
    category: "Ward Round",
    priority: "Normal",
    dueTime: "04:00 PM",
    completed: false,
  },
];

const AssignedTask = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("hms_surgeon_assigned_tasks");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_SURGICAL_TASKS;
  });

  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "pending" | "completed"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    category: "Pre-Operative",
    priority: "Normal",
    dueTime: "09:00 AM",
  });

  useEffect(() => {
    try {
      localStorage.setItem("hms_surgeon_assigned_tasks", JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success("Task removed");
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error("Please enter a task description");
      return;
    }

    const created = {
      id: `task-${Date.now()}`,
      title: newTask.title.trim(),
      category: newTask.category,
      priority: newTask.priority,
      dueTime: newTask.dueTime || "12:00 PM",
      completed: false,
    };

    setTasks((prev) => [created, ...prev]);
    setNewTask({
      title: "",
      category: "Pre-Operative",
      priority: "Normal",
      dueTime: "09:00 AM",
    });
    setIsCreateModalOpen(false);
    toast.success("Surgical task created");
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredTasks = useMemo(() => {
    if (activeFilter === "completed") return tasks.filter((t) => t.completed);
    if (activeFilter === "pending") return tasks.filter((t) => !t.completed);
    return tasks;
  }, [tasks, activeFilter]);

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex h-screen bg-base-200/50">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="overflow-y-auto flex flex-col gap-6 p-4 sm:p-6 lg:p-8 h-full">
          {/* HEADER ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <RiMentalHealthFill className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-black text-base-content tracking-tight">
                  Surgical Tasks & Checklists
                </h1>
              </div>
              <p className="text-xs text-base-content/60 mt-1 flex items-center gap-1.5">
                <FaCalendarAlt className="text-primary w-3 h-3" />
                {currentDateFormatted} • Operating Theatre Protocols
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-sm btn-primary gap-1.5 font-semibold text-white shadow-xs"
            >
              <FaPlus className="w-3.5 h-3.5" />
              Add Surgical Task
            </button>
          </div>

          {/* MAIN 2-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* LEFT 2 COLS: TASK LIST */}
            <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-200">
              <div className="p-5 border-b border-base-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FaClipboardList className="text-primary w-4 h-4" />
                  <h2 className="font-bold text-base text-base-content">
                    Theatre Checklist ({filteredTasks.length})
                  </h2>
                </div>

                <div className="join">
                  <button
                    className={`btn btn-xs join-item ${
                      activeFilter === "all" ? "btn-primary text-white" : "btn-ghost"
                    }`}
                    onClick={() => setActiveFilter("all")}
                  >
                    All ({totalTasks})
                  </button>
                  <button
                    className={`btn btn-xs join-item ${
                      activeFilter === "pending" ? "btn-primary text-white" : "btn-ghost"
                    }`}
                    onClick={() => setActiveFilter("pending")}
                  >
                    Pending ({pendingTasks})
                  </button>
                  <button
                    className={`btn btn-xs join-item ${
                      activeFilter === "completed" ? "btn-primary text-white" : "btn-ghost"
                    }`}
                    onClick={() => setActiveFilter("completed")}
                  >
                    Completed ({completedTasks})
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                {filteredTasks.length === 0 ? (
                  <div className="py-12 text-center text-base-content/50 space-y-2">
                    <FaCheckCircle className="w-8 h-8 mx-auto text-success/50" />
                    <p className="text-sm font-medium">No tasks found in this view</p>
                    <p className="text-xs">All caught up or try switching filters.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-base-200">
                    {filteredTasks.map((task) => (
                      <li
                        key={task.id}
                        className={`py-3.5 px-3 rounded-xl transition-all flex items-center justify-between gap-4 group hover:bg-base-200/50 ${
                          task.completed ? "opacity-60 bg-base-200/20" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task.id)}
                            className="checkbox checkbox-primary checkbox-sm mt-0.5"
                          />

                          <div className="flex flex-col gap-1 min-w-0">
                            <span
                              className={`text-sm font-medium leading-snug break-words ${
                                task.completed
                                  ? "line-through text-base-content/50"
                                  : "text-base-content"
                              }`}
                            >
                              {task.title}
                            </span>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="badge badge-xs badge-outline font-medium">
                                {task.category}
                              </span>

                              {task.priority === "Urgent" && (
                                <span className="badge badge-xs badge-error text-white font-bold">
                                  Urgent
                                </span>
                              )}
                              {task.priority === "High" && (
                                <span className="badge badge-xs badge-warning text-white font-bold">
                                  High
                                </span>
                              )}

                              <span className="text-[11px] text-base-content/50 flex items-center gap-1">
                                <FaClock className="w-2.5 h-2.5" />
                                Due: {task.dueTime}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="btn btn-ghost btn-xs text-error opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete task"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* RIGHT COL: STATS & SUMMARY */}
            <div className="flex flex-col gap-5">
              {/* STAT CARD 1: PROGRESS */}
              <div className="card bg-base-100 shadow-sm border border-base-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-base-content">
                    Task Completion Rate
                  </h3>
                  <span className="text-lg font-black text-primary">
                    {completionRate}%
                  </span>
                </div>

                <div className="w-full bg-base-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300 rounded-full"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-center">
                  <div className="p-3 rounded-xl bg-base-200/40 border border-base-200">
                    <p className="text-2xl font-black text-base-content">
                      {totalTasks}
                    </p>
                    <p className="text-[11px] text-base-content/60 uppercase font-semibold">
                      Total Tasks
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                    <p className="text-2xl font-black text-success">
                      {completedTasks}
                    </p>
                    <p className="text-[11px] text-success uppercase font-semibold">
                      Completed
                    </p>
                  </div>
                </div>
              </div>

              {/* STAT CARD 2: PROTOCOLS REMINDER */}
              <div className="card bg-gradient-to-br from-indigo-500/10 to-primary/10 border border-primary/20 p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <FaExclamationCircle className="w-4 h-4" />
                  <span>Theatre Safety Reminder</span>
                </div>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  Always ensure swab counts and surgical instrument tallies are double-checked with the scrub nurse before wound closure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE TASK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-base-200 flex justify-between items-center">
              <h3 className="font-bold text-base text-base-content">
                Create Surgical Task
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="btn btn-ghost btn-circle btn-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">
                    Task Description *
                  </span>
                </label>
                <textarea
                  required
                  rows={3}
                  className="textarea textarea-bordered w-full text-sm"
                  placeholder="e.g. Verify patient coagulation profile before incision..."
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs font-semibold">
                      Category
                    </span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full text-xs"
                    value={newTask.category}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, category: e.target.value }))
                    }
                  >
                    <option value="Pre-Operative">Pre-Operative</option>
                    <option value="Theatre Prep">Theatre Prep</option>
                    <option value="Intra-Operative">Intra-Operative</option>
                    <option value="Post-Operative">Post-Operative</option>
                    <option value="Ward Round">Ward Round</option>
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs font-semibold">
                      Priority
                    </span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full text-xs"
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, priority: e.target.value }))
                    }
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Due Time</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10:30 AM"
                  className="input input-bordered input-sm w-full text-xs"
                  value={newTask.dueTime}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, dueTime: e.target.value }))
                  }
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm text-white">
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedTask;
