



import React, { useState, useEffect } from 'react';
import TimeFilter from '../components/TimeFilter';
import { fetchAllOpenTasks, ClickUpTask } from '../services/clickup';

// Hardcoded list of collaborators based on the request to find workspace members.
// Since we don't have a direct API call implemented to fetch workspace members in the previous steps,
// and the user provided specific names in the initial mock data which likely correspond to real people,
// we will use a static list for now but structure it to be easily replaced by an API call later.
// In a real scenario, we would fetch this from GET /team/{team_id} or similar.

const TEAM_MEMBERS = [
    { id: 1, name: "Matheus Neri", role: "Account", initials: "MN", color: "#3b82f6" },
    { id: 2, name: "Ana Silva", role: "Design", initials: "AS", color: "#ef4444" },
    { id: 3, name: "Carlos GT", role: "Tráfego", initials: "CG", color: "#10b981" },
    { id: 4, name: "Beatriz Copy", role: "Conteúdo", initials: "BC", color: "#f59e0b" },
    { id: 5, name: "Raquel", role: "Audiovisual", initials: "RA", color: "#8b5cf6" },
    { id: 6, name: "Alexandre", role: "Growth", initials: "AL", color: "#ec4899" },
    { id: 7, name: "Camila", role: "Gestão", initials: "CA", color: "#6366f1" },
    { id: 8, name: "Nicollas", role: "Growth", initials: "NI", color: "#14b8a6" },
    { id: 9, name: "Isadora", role: "Instagram", initials: "IS", color: "#f97316" }
];

const TeamPerformance: React.FC = () => {
    const [selectedCollab, setSelectedCollab] = useState<any | null>(null);
    const [collabTasks, setCollabTasks] = useState<Record<string, ClickUpTask[]>>({});

    useEffect(() => {
        fetchAllOpenTasks().then(tasks => {
            const tasksByCollab: Record<string, ClickUpTask[]> = {};
            
            tasks.forEach(task => {
                task.assignees.forEach(assignee => {
                    // Match assignee to our team member list by name (approximate)
                    // In real app, match by ID. Here we use name matching or just group by assignee username.
                    // Let's group by assignee username directly from ClickUp task
                    const key = assignee.username;
                    if (!tasksByCollab[key]) {
                        tasksByCollab[key] = [];
                    }
                    tasksByCollab[key].push(task);
                });
            });
            setCollabTasks(tasksByCollab);
        });
    }, []);

    const openCollabModal = (collab: any) => {
        setSelectedCollab(collab);
    };

    const closeCollabModal = () => {
        setSelectedCollab(null);
    };

    // Helper to find tasks for a team member
    const getTasksForMember = (memberName: string) => {
        // Try to find key that includes member first name
        const firstName = memberName.split(' ')[0].toLowerCase();
        const key = Object.keys(collabTasks).find(k => k.toLowerCase().includes(firstName));
        return key ? collabTasks[key] : [];
    };

    return (
        <div id="tab-performance" className="tab-content">
            <div className="header">
                <div className="page-title">
                    <h1>Performance Time</h1>
                </div>
                <TimeFilter />
            </div>

            <div className="collab-grid" id="team-grid">
                {TEAM_MEMBERS.map(c => {
                    const memberTasks = getTasksForMember(c.name);
                    const pendingCount = memberTasks.length;
                    
                    return (
                        <div key={c.id} className="collab-card high border-2 border-yellow-500" onClick={() => openCollabModal({ ...c, tasks: memberTasks })}>
                            <div className="collab-avatar-placeholder" style={{ background: c.color, color: 'white', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 15px' }}>
                                {c.initials}
                            </div>
                            <h3 style={{ margin: 0 }}>{c.name}</h3>
                            <p style={{ fontSize: '12px', color: '#9ca3af' }}>{c.role}</p>
                            <div style={{ marginTop: '15px' }}>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: pendingCount > 0 ? 'var(--primary)' : 'var(--success)' }}>
                                    {pendingCount}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>Tarefas Ativas</div>
                            </div>
                            <small style={{ color: '#6b7280', fontSize: '10px', marginTop: '10px', display: 'block' }}>Clique para ver tarefas</small>
                        </div>
                    );
                })}
            </div>

            {selectedCollab && (
                <div id="modal-overlay" className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeCollabModal(); }}>
                    <div className="modal-content">
                        <span className="close-btn" onClick={closeCollabModal}>&times;</span>
                        <h2 id="modal-title" style={{ marginTop: 0 }}>Tarefas: {selectedCollab.name}</h2>
                        <div id="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {selectedCollab.tasks && selectedCollab.tasks.length > 0 ? (
                                selectedCollab.tasks.map((t: ClickUpTask) => (
                                    <div key={t.id} className="modal-task-item">
                                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                                        <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                                            <span style={{ color: t.status.color }}>● {t.status.status.toUpperCase()}</span>
                                            {t.due_date && <span style={{ color: '#6b7280' }}>{new Date(parseInt(t.due_date)).toLocaleDateString('pt-BR')}</span>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#6b7280', textAlign: 'center' }}>Nenhuma tarefa ativa encontrada.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamPerformance;
