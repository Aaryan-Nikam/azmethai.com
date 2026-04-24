// Removed unused React import
import { Search, Clock, Workflow, Settings, Bug } from 'lucide-react';

interface SidebarProps {
    onClearCanvas?: () => void;
}

export function Sidebar({ onClearCanvas }: SidebarProps) {
    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <span className="logo-icon">⚡</span>
            </div>

            <div className="sidebar-icons">
                <button className="sidebar-btn" title="Search">
                    <Search size={18} />
                </button>
                <button className="sidebar-btn" title="History">
                    <Clock size={18} />
                </button>
                <button className="sidebar-btn active" title="Workflow Canvas">
                    <Workflow size={18} />
                </button>
            </div>

            <div className="sidebar-bottom">
                <button className="sidebar-btn" title="Clear Canvas" onClick={onClearCanvas}>
                    <Bug size={18} />
                </button>
                <button className="sidebar-btn" title="Settings">
                    <Settings size={18} />
                </button>
            </div>
        </div>
    );
}
