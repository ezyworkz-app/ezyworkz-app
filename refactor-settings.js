const fs = require('fs');

const path = 'src/app/(admin)/settings/SettingsClient.tsx';
let content = fs.readFileSync(path, 'utf8');

// Normalize newlines
content = content.replace(/\r\n/g, '\n');

// 1. Add activeTab state
content = content.replace(
    'const [isSaving, setIsSaving] = useState(false);',
    'const [activeTab, setActiveTab] = useState<"general" | "location" | "billing" | "analytics">("general");\n    const [isSaving, setIsSaving] = useState(false);'
);

// 2. Extract sections
const getSection = (startMarker, endMarker) => {
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker, startIndex);
    if (startIndex === -1 || endIndex === -1) {
        throw new Error(`Markers not found: ${startMarker} or ${endMarker}`);
    }
    return content.substring(startIndex, endIndex);
};

const basicInfo = getSection('{/* Basic Information */}', '{/* Address & Location */}');
const addressLocation = getSection('{/* Address & Location */}', '{/* Billing & Tax Preferences */}');
const billingTax = getSection('{/* Billing & Tax Preferences */}', '                    </div>\n\n                    {/* RIGHT COLUMN */}');
const operationalTimings = getSection('{/* Operational Timings */}', '{/* Logos & Assets */}');
const logosAssets = getSection('{/* Logos & Assets */}', '{/* Analytics & Tracking */}');
const analyticsTracking = getSection('{/* Analytics & Tracking */}', '                    </div>\n                </div>');

// 3. Construct new layout
const newLayout = `
                {/* Tabs Navigation */}
                <div className="flex items-center gap-2 mb-8 border-b border-gray-200 pb-px overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab("general")}
                        className={\`px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap \${activeTab === "general" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}\`}
                    >
                        General Info
                    </button>
                    <button 
                        onClick={() => setActiveTab("location")}
                        className={\`px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap \${activeTab === "location" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}\`}
                    >
                        Location & Timings
                    </button>
                    <button 
                        onClick={() => setActiveTab("billing")}
                        className={\`px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap \${activeTab === "billing" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}\`}
                    >
                        Billing & Fees
                    </button>
                    <button 
                        onClick={() => setActiveTab("analytics")}
                        className={\`px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap \${activeTab === "analytics" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}\`}
                    >
                        Analytics
                    </button>
                </div>

                <div className="pb-12 max-w-3xl">
                    {/* GENERAL TAB */}
                    {activeTab === "general" && (
                        <div className="space-y-8">
                            ${basicInfo}
                            ${logosAssets}
                        </div>
                    )}

                    {/* LOCATION TAB */}
                    {activeTab === "location" && (
                        <div className="space-y-8">
                            ${addressLocation}
                            ${operationalTimings}
                        </div>
                    )}

                    {/* BILLING TAB */}
                    {activeTab === "billing" && (
                        <div className="space-y-8">
                            ${billingTax}
                        </div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === "analytics" && (
                        <div className="space-y-8">
                            ${analyticsTracking}
                        </div>
                    )}
                </div>`;

const layoutStart = content.indexOf('<div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-12">');
const layoutEnd = content.indexOf('</div>\n            </main>');
if (layoutStart === -1 || layoutEnd === -1) {
    throw new Error("Layout markers not found");
}

const newContent = content.substring(0, layoutStart) + newLayout + '\n            </main>' + content.substring(layoutEnd + '</div>\n            </main>'.length);

fs.writeFileSync(path, newContent);
console.log("Refactored SettingsClient.tsx successfully");
