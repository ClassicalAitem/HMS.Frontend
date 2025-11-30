import React from 'react'
import { Header } from "@/components/common";
import Sidebar from "@/components/pharmacist/dashboard/Sidebar";

const Transactions = () => {
  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1 ">
          <section className="p-7">
           Lorem ipsum dolor sit, amet consectetur adipisicing elit. Ratione fugit voluptate quia, perspiciatis sapiente excepturi magni dignissimos quidem tempora ipsa facilis sit expedita deleniti optio, hic adipisci aliquid et animi provident itaque beatae. Doloremque vel id animi qui inventore minus provident unde, nesciunt architecto consectetur fugit blanditiis exercitationem deleniti temporibus ea accusantium perspiciatis similique nostrum, modi ab placeat. Quidem suscipit molestias repellat in dolore atque? Adipisci unde vitae dolores reprehenderit molestiae, commodi praesentium nam cupiditate cum? Neque voluptatum doloremque minima dignissimos excepturi officiis quis quod dolorum eius dolore, nisi vel aliquid quibusdam laborum cum blanditiis veniam placeat perspiciatis nemo beatae?
          </section>
        </div>
      </div>
    </div>
  );
}

export default Transactions
