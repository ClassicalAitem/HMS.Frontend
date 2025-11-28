import React from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/pharmacist/dashboard/Sidebar";

const PharmacistDashboard = () => {
  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1 ">
          <section className="p-7">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Facilis
            earum nobis minima iusto error. Fugiat eos dolorum neque ducimus
            quas delectus recusandae, deleniti fuga excepturi cum. Veritatis,
            sit enim? Excepturi voluptate dolorem id molestias ex. Dolores
            debitis reprehenderit, pariatur voluptatem id ut sunt perferendis
            eum itaque suscipit aspernatur non enim!
          </section>
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;
