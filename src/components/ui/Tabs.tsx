import { ReactNode, useState } from "react";

interface TabProps {
    title: string;
    children: ReactNode;
    count?: number;
}

interface TabsProps {
    children: ReactNode[];
    activeTab?: number;
    onTabChange?: (index: number) => void;
}

export const Tab = ({ children }: TabProps) => {
    return <div className="py-6 w-full max-w-full min-w-0">{children}</div>;
};

export const Tabs = ({ children, activeTab: controlledActiveTab, onTabChange }: TabsProps) => {
    const [internalActiveTab, setInternalActiveTab] = useState(0);
    
    const isControlled = controlledActiveTab !== undefined;
    const activeTab = isControlled ? controlledActiveTab : internalActiveTab;
    
    const handleTabChange = (index: number) => {
        if (onTabChange) {
            onTabChange(index);
        }
        if (!isControlled) {
            setInternalActiveTab(index);
        }
    };

    const tabs = children.filter(Boolean) as React.ReactElement<TabProps>[];

    return (
        <div className="w-full min-w-0 overflow-hidden">
            {/* Mobile Dropdown */}
            <div className="md:hidden mb-4 overflow-hidden">
                <select
                    className="w-full h-11 appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-sm focus:border-teal-300 focus:outline-none focus:ring-3 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    value={activeTab}
                    onChange={(e) => handleTabChange(Number(e.target.value))}
                >
                    {tabs.map((tab, index) => (
                        <option key={index} value={index}>
                            {tab.props.title}
                            {tab.props.count !== undefined ? ` (${tab.props.count})` : ""}
                        </option>
                    ))}
                </select>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:flex space-x-8 border-b border-gray-200 dark:border-gray-800 mb-6 px-0 overflow-x-auto no-scrollbar max-w-full min-w-0">
                {tabs.map((tab, index) => (
                    <button
                        key={index}
                        className={`shrink-0 py-3 px-0 text-xs font-bold transition-all duration-200 flex items-center gap-2 relative whitespace-nowrap ${activeTab === index
                            ? "text-teal-600"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                        onClick={() => handleTabChange(index)}
                    >
                        {tab.props.title}
                        {tab.props.count !== undefined && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${activeTab === index ? "bg-teal-50 text-teal-600 dark:bg-teal-500/15" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                }`}>
                                {tab.props.count}
                            </span>
                        )}
                        {activeTab === index && (
                            <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-teal-500 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            <div>{tabs[activeTab]}</div>
        </div>
    );
};
