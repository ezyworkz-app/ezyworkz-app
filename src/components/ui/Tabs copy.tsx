import { ReactNode, useState } from "react";

interface TabProps {
  title: string;
  children: ReactNode;
  count?: number;
}

interface TabsProps {
  children: ReactNode[];
}

export const Tab = ({ children }: TabProps) => {
  return <div className="p-4">{children}</div>;
};

export const Tabs = ({ children }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = children as React.ReactElement<TabProps>[];

  return (
    <div>
      {/* Mobile Dropdown */}
      <div className="md:hidden mb-4 px-4">
        <select
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
          value={activeTab}
          onChange={(e) => setActiveTab(Number(e.target.value))}
        >
          {tabs.map((tab, index) => (
            <option key={index} value={index}>
              {tab.props.title}
              {tab.props.count !== undefined ? `(${tab.props.count})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden md:flex space-x-1 border-b border-gray-100 mb-6 px-4">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`py-3 px-4 text-xs font-bold transition-all duration-200 flex items-center gap-2 relative ${activeTab === index
                ? "text-indigo-600"
                : "text-gray-400 hover:text-gray-600"
              }`}
            onClick={() => setActiveTab(index)}
          >
            {tab.props.title}
            {tab.props.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${activeTab === index ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-500"
                }`}>
                {tab.props.count}
              </span>
            )}
            {activeTab === index && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full shadow-[0_-1px_4px_rgba(79,70,229,0.3)]" />
            )}
          </button>
        ))}
      </div>

      <div>{tabs[activeTab]}</div>
    </div>
  );
};
