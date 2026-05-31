const CategoryPills = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === category
              ? 'bg-[#C28C5D] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryPills;
