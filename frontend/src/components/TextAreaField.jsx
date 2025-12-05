

const TextAreaField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder, 
  icon: Icon,
  rows = 3
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        )}
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          className={`w-full ${Icon ? 'pl-11' : 'px-4'} pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

export default TextAreaField