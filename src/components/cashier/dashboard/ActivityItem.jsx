
const ActivityItem = ({ activity }) => {
  const { patientName, time, service, status, hmo, amount } = activity || {};
  const initials = (patientName || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('.') || 'NA';
  return (
    <div className="2xl:p-4 rounded-xl bg-base-100 border border-base-300 p-2">
      <div className="grid grid-cols-12 gap-4 items-center ">
        {/* Left: Patient */}
        <div className="col-span-12 md:col-span-4 flex items-center gap-3">
          <div className="border-2 w-10 h-10 2xl:w-12 2xl:h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
            {initials}
          </div>
          <div>
            <h3 className="text-sm 2xl:text-lg 2xl:font-semibold text-base-content">{patientName}</h3>
            <p className="text-xs text-base-content/70">Received {time}</p>
          </div>
        </div>

        {/* Middle: Service & Status */}
        <div className="col-span-12 md:col-span-5 md:border-l md:pl-4 border-base-300">
          <p className="text-sm 2xl:text-lg text-base-content/80 font-regular">{service}</p>
          <p className="text-xs mt-1 text-primary">Status: {status}</p>
        </div>

        {/* Right: HMO & Amount */}
        <div className="col-span-12 md:col-span-3 text-right">
          <p className="text-xs 2xl:text-sm text-base-content/70 font-regular">{hmo}</p>
          <p className="text-sm 2xl:text-lg font-bold text-primary">{amount}</p>
        </div>
      </div>
    </div>
  );
};

export default ActivityItem;