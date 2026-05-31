const StatCard = ({ title, value, icon, extra }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center relative overflow-hidden">
      <div className="flex items-center justify-center gap-2 mb-2">
        <h2 className="text-4xl font-extrabold text-gray-900">{value}</h2>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <p className="text-sm font-bold text-gray-800">{title}</p>
      {extra && <div className="mt-2">{extra}</div>}
    </div>
  );
};

export default StatCard;
