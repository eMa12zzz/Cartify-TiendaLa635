const DataTable = ({ columns, data, renderRow }) => {
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col, index) => (
                <th key={index} className="py-4 px-4 text-xs font-medium text-gray-500 bg-white">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {data.map((item, index) => (
              <tr key={item.id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                {renderRow(item)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Paginación simple (Visual) */}
      <div className="flex justify-between items-center mt-4 py-4 px-2">
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
          Anterior
        </button>
        <span className="text-sm text-gray-500">Página 1 de 10</span>
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default DataTable;
