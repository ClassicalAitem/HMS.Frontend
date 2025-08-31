import React from 'react';
import LineChart from '@/components/charts/LineChart';
import RadialBarChart from '@/components/charts/RadialBarChart';
import RadialLineChart from '@/components/charts/RadialLineChart';
import ArialChart from '@/components/charts/ArialChart';

import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const chart1 = {
    id: 1,
    color: '#FF0000',
    data: [25, 66, 41, 59, 25, 44, 12],
    label: 'sales',
    value: 641
  };
  const chart2 = {
    id: 2,
    color: '#00FF00',
    data: [25, 66, 41, 59, 25, 44, 12],
    label: 'income',
    value: 389.9
  };
  const chart3 = {
    id: 3,
    color: '#003eaa',
    data: [25, 66, 41, 59, 25, 44, 12],
    label: 'Orders',
    value: 43
  };
  const chart4 = {
    id: 4,
    color: '#f6b01e',
    data: [25, 66, 41, 59, 25, 44, 12],
    label: 'Abandoned',
    value: 641
  };

  return (
    <main>
      <div className="">
        <div className="grid grid-cols-12 gap-4">
          <LineChart
            id={chart1.id}
            data={chart1.data}
            color={chart1.color}
            label={chart1.label}
            value={chart1.value}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              role="img"
              className="icon text-danger/50 h-7 w-7"
              viewBox="0 0 256 256"
            >
              <g fill="currentColor">
                <path d="m216 64l-12.16 66.86A16 16 0 0 1 188.1 144H62.55L48 64Z" opacity=".2" />
                <path d="M222.14 58.87A8 8 0 0 0 216 56H54.68l-4.89-26.86A16 16 0 0 0 34.05 16H16a8 8 0 0 0 0 16h18l25.56 140.29a24 24 0 0 0 5.33 11.27a28 28 0 1 0 44.4 8.44h45.42a27.75 27.75 0 0 0-2.71 12a28 28 0 1 0 28-28H83.17a8 8 0 0 1-7.87-6.57L72.13 152h116a24 24 0 0 0 23.61-19.71l12.16-66.86a8 8 0 0 0-1.76-6.56ZM96 204a12 12 0 1 1-12-12a12 12 0 0 1 12 12Zm96 0a12 12 0 1 1-12-12a12 12 0 0 1 12 12Zm4-74.57a8 8 0 0 1-7.9 6.57H69.22L57.59 72h148.82Z" />
              </g>
            </svg>
          </LineChart>

          {/*chart 1*/}
          <LineChart
            id={chart2.id}
            data={chart2.data}
            color={chart2.color}
            label={chart2.label}
            value={chart2.value}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              role="img"
              className="icon text-green/50 h-7 w-7"
              viewBox="0 0 256 256"
            >
              <g fill="currentColor">
                <path
                  d="M160 128a32 32 0 1 1-32-32a32 32 0 0 1 32 32Zm40-64a48.85 48.85 0 0 0 40 40V64Zm0 128h40v-40a48.85 48.85 0 0 0-40 40ZM16 152v40h40a48.85 48.85 0 0 0-40-40Zm0-48a48.85 48.85 0 0 0 40-40H16Z"
                  opacity=".2"
                />
                <path d="M128 88a40 40 0 1 0 40 40a40 40 0 0 0-40-40Zm0 64a24 24 0 1 1 24-24a24 24 0 0 1-24 24Zm112-96H16a8 8 0 0 0-8 8v128a8 8 0 0 0 8 8h224a8 8 0 0 0 8-8V64a8 8 0 0 0-8-8ZM24 72h21.37A40.81 40.81 0 0 1 24 93.37Zm0 112v-21.37A40.81 40.81 0 0 1 45.37 184Zm208 0h-21.37A40.81 40.81 0 0 1 232 162.63Zm0-38.35A56.78 56.78 0 0 0 193.65 184H62.35A56.78 56.78 0 0 0 24 145.65v-35.3A56.78 56.78 0 0 0 62.35 72h131.3A56.78 56.78 0 0 0 232 110.35Zm0-52.28A40.81 40.81 0 0 1 210.63 72H232Z" />
              </g>
            </svg>
          </LineChart>

          {/*chart 2*/}
          <LineChart
            id={chart3.id}
            data={chart3.data}
            color={chart3.color}
            label={chart3.label}
            value={chart3.value}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              role="img"
              className="icon text-blue/50 h-7 w-7"
              viewBox="0 0 256 256"
            >
              <g fill="currentColor">
                <path
                  d="M128 129.09V232a8 8 0 0 1-3.84-1l-88-48.18a8 8 0 0 1-4.16-7V80.18a8 8 0 0 1 .7-3.25Z"
                  opacity=".2"
                />
                <path d="m223.68 66.15l-88-48.15a15.88 15.88 0 0 0-15.36 0l-88 48.17a16 16 0 0 0-8.32 14v95.64a16 16 0 0 0 8.32 14l88 48.17a15.88 15.88 0 0 0 15.36 0l88-48.17a16 16 0 0 0 8.32-14V80.18a16 16 0 0 0-8.32-14.03ZM128 32l80.34 44l-29.77 16.3l-80.35-44Zm0 88L47.66 76l33.9-18.56l80.34 44ZM40 90l80 43.78v85.79l-80-43.75Zm176 85.78l-80 43.79v-85.75l32-17.51V152a8 8 0 0 0 16 0v-44.45L216 90v85.77Z" />
              </g>
            </svg>
          </LineChart>

          {/*chart 3*/}
          <LineChart
            id={chart4.id}
            data={chart4.data}
            color={chart4.color}
            label={chart4.label}
            value={chart4.value}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              role="img"
              className="icon text-gold/50 h-7 w-7"
              viewBox="0 0 256 256"
            >
              <g fill="currentColor">
                <path d="M216 136a88 88 0 1 1-88-88a88 88 0 0 1 88 88Z" opacity=".2" />
                <path d="M128 40a96 96 0 1 0 96 96a96.11 96.11 0 0 0-96-96Zm0 176a80 80 0 1 1 80-80a80.09 80.09 0 0 1-80 80Zm45.66-125.66a8 8 0 0 1 0 11.32l-40 40a8 8 0 0 1-11.32-11.32l40-40a8 8 0 0 1 11.32 0ZM96 16a8 8 0 0 1 8-8h48a8 8 0 0 1 0 16h-48a8 8 0 0 1-8-8Z" />
              </g>
            </svg>
          </LineChart>

          {/*Line chart 4*/}
          <div className="relative col-span-12 md:col-span-7">
            <div className="border-gray relative w-full border bg-white transition-all duration-300 rounded-md p-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-heading text-base font-semibold leading-tight text-dark">
                  <span>Revenue Overview</span>
                </h3>
                <Link
                  aria-current="page"
                  href="#"
                  className="router-link-active router-link-exact-active bg-green/20 hover:bg-green/30 text-green rounded-lg px-4 py-2 text-sm font-medium underline-offset-4 transition-colors duration-300"
                >
                  Details
                </Link>
              </div>
              <div className="flex gap-8 w-full">
                <div>
                  <span className="text-dark-gray font-sans text-xs">This month</span>
                  <p className="text-green font-sans text-lg font-medium">$75,689</p>
                </div>
                <div>
                  <span className="text-dark-gray font-sans text-xs">Last month</span>
                  <p className="text-dark text-lg font-medium">$59,724</p>
                </div>
                <div>
                  <span className="text-dark-gray text-xs">Average</span>
                  <p className="text-dark text-lg font-medium">$66,561</p>
                </div>
              </div>

              <div
                style={{
                  height: '273px',
                  display: 'block',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <ArialChart />
              </div>
            </div>
          </div>
          {/*Arial Chart*/}
          <div className="relative col-span-12 md:col-span-5">
            <div className="flex h-full flex-col gap-6">
              <div className="border-gray relative w-full border bg-white transition-all duration-300 rounded-md flex-1 p-6">
                <div className="flex items-center justify-center">
                  <div className="flex-1">
                    <h3 className="font-heading text-base font-semibold leading-tight text-dark-gray mb-4">
                      <span>Sales Revenue</span>
                    </h3>
                    <h4 className="font-heading text-lg font-light leading-tight text-dark-gray mb-2">
                      <span>$8,641.26</span>
                    </h4>
                    <p className="font-alt text-xs font-normal">
                      <span className="text-dark-gray">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Bonum integritas
                        corporis.
                      </span>
                    </p>
                  </div>
                  <div className="flex-1">
                    <RadialBarChart />{' '}
                  </div>
                </div>
              </div>

              <div className="border-gray relative w-full border bg-white transition-all duration-300 rounded-md flex-1 p-6">
                <div className="w-full">
                  {' '}
                  <RadialLineChart />{' '}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/*Grids*/}
      </div>
    </main>
  );
};
export default AdminDashboard;
