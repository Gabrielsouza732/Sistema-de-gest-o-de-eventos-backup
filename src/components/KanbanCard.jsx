import React, { useState, useEffect } from 'react';
import './KanbanCard.css';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDaysIcon,
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  TagIcon,
  ComputerDesktopIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  PlusIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
  UserGroupIcon,
  CubeIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';


export default function KanbanCard({ event, column }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [hovered, setHovered] = useState(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const [assignedMembers, setAssignedMembers] = useState([]);

  const userName = localStorage.getItem('eventUserName');

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2); // Pega apenas os 2 últimos dígitos do ano
    return `${day}/${month}/${year}`;
  };

  const formatDateRange = (startDate, endDate) => {
    const formattedStart = formatDate(startDate);
    const formattedEnd = formatDate(endDate);
    
    if (formattedStart === "N/A" && formattedEnd === "N/A") {
      return "N/A";
    } else if (formattedStart === "N/A") {
      return formattedEnd;
    } else if (formattedEnd === "N/A") {
      return formattedStart;
    } else {
      return `${formattedStart} - ${formattedEnd}`;
    }
  };

  /*Função p adicionar membro manualmente*/ 
  const addEventMember = (member) => {
  setAssignedMembers((prev) => {
    if (prev.find((m) => m.id === member.id)) return prev;
    return [...prev, member];
  });
};

/* Função para remover membro (quando clicar no "X") */ 
const removeEventMember = (memberId) => {
  setAssignedMembers((prev) => prev.filter((m) => m.id !== memberId));
};

  const formatBudget = (budget) => {
    if (budget === undefined || budget === null || isNaN(Number(budget))) return "N/A";
    return Number(budget).toLocaleString("pt-BR", {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'alta': return '#e74c3c';
      case 'média': return '#f39c12';
      case 'baixa': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [checklistExpanded, setChecklistExpanded] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');

  // ✅ NOVO: Estado aprimorado para checklist com responsáveis
  const [checklistItems, setChecklistItems] = useState([
    { id: 'budget', text: 'Orçamento', completed: false, responsible: null },
    { id: 'coffeebreak', text: 'Coffeebreak', completed: false, responsible: { name: 'João Santos', initials: 'JS' } },
    { id: 'organization', text: 'Organização', completed: false, responsible: null }
  ]);

  // ✅ NOVO: Lista de membros disponíveis para atribuição
  const availableMembers = [
    { id: 1, name: 'João Santos', initials: 'JS' },
    { id: 2, name: 'Maria Silva', initials: 'MS' },
    { id: 3, name: 'Pedro Costa', initials: 'PC' },
    { id: 4, name: 'Ana Oliveira', initials: 'AO' }
  ];

  const [comments, setComments] = useState({
    [event.id]: [
      { id: '1', author: 'Maria Silva', text: 'Precisamos confirmar o palestrante principal até amanhã.', timestamp: '25/06/2025 14:30' },
      { id: '2', author: 'João Santos', text: 'Orçamento aprovado pela diretoria.', timestamp: '26/06/2025 09:15' }
    ]
  });

  const handleOpenModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleCloseModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(false);
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
    // Fechar dropdown de membros se clicar fora dele
    if (showMemberDropdown && !e.target.closest('.modal-add-member-container')) {
      setShowMemberDropdown(false);
    }
  };

  /* Atualizações de checklist */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

  const toggleChecklistItem = (itemId) => {
    setChecklistItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const now = new Date().toISOString();
          return {
            ...item,
            completed: !item.completed,
            completedAt: !item.completed ? now : null
          };
        }
        return item;
      })
    );
  };

  const assignResponsible = (itemId, member) => {
    setChecklistItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const alreadyAssigned = item.responsible && item.responsible.name !== member.name;
          const isNewAssignment = !item.responsible && member;
          if (isNewAssignment || alreadyAssigned) {
          addEventMember(member); // 👉 adiciona ao quadro de membros
        }
          return {
            ...item,
            responsible: member,
            assignedAt: isNewAssignment || alreadyAssigned ? new Date().toISOString() : item.assignedAt
          };
        }
        return item;
      })
    );
  };

  const addChecklistItem = () => {
  const newItemText = prompt('Digite o nome do novo item:');
  if (newItemText && newItemText.trim()) {
    const newItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false,
      responsible: null,
      assignedAt: null,
      completedAt: null
    };
    setChecklistItems(prev => [...prev, newItem]);
  }
};


  const removeChecklistItem = (itemId) => {
    setChecklistItems(prev => prev.filter(item => item.id !== itemId));
  };

  const removeResponsible = (itemId) => {
    setChecklistItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, responsible: null, assignedAt: null } : item
      )
    );
  };

  
  
  useEffect(() => {
    checklistItems.forEach(item => {
    if (item.responsible && item.assignedAt) {
      if (item.responsible && item.assignedAt) {
  console.log('📧 Enviar e-mail: novo responsável atribuído', {
    item: item.text,
    responsavel: item.responsible.name,
    dataAtribuicao: item.assignedAt
  });
}

    }

    if (!item.completed && event.endDate) {
      const deadline = new Date(event.endDate);
      const now = new Date();
      const msInDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.floor((deadline - now) / msInDay);

      if (diffDays === 1 && item.responsible) {
        console.log('⏰ Enviar lembrete: item não concluído com prazo próximo', {
          item: item.text,
          responsavel: item.responsible.name,
          prazoFinal: event.endDate
      });
    }
  }
  });
}, [checklistItems]);

  
  
  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj = {
        id: Date.now().toString(),
        author: 'Usuário Atual', // Pode ser dinâmico no futuro
        text: newComment.trim(),
        timestamp: new Date().toLocaleString('pt-BR')
      };
      setComments(prev => ({
        ...prev,
        [event.id]: [...(prev[event.id] || []), newCommentObj]
      }));
      setNewComment('');
    }
  };

  return (
    <>
      {/* Card compacto */}
      <div 
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`kanban-card ${column.toLowerCase().replace(" ", "-")}`}
      >
        {/* Header do Card */}
        <div className="card-header">
          <h4 className="card-title">{event.title}</h4>
          <button 
            className="card-expand-button"
            onClick={handleOpenModal}
            title="Expandir card"
          >
            ⤢
          </button>
        </div>

        {/* Informações principais - sempre visíveis */}
        <div className="card-info">
          <div className="info-item">
            <span className="info-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '4px' }}>
              <CalendarDaysIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </span>
            <span className="info-label">Data:</span>
            <span className="info-value">{formatDateRange(event.startDate, event.endDate)}</span>
          </div>

          <div className="info-item">
            <span className="info-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '4px' }}>
              <UserIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </span>
            <span className="info-label">Responsável:</span>
            <span className="info-value">{event.requester || 'N/A'}</span>
          </div>

          <div className="info-item">
            <span className="info-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '4px' }}>
              <ExclamationTriangleIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </span>
            <span className="info-label">Prioridade:</span>
            <span 
              className="priority-badge"
              style={{ color: getPriorityColor(event.priority || 'Alta') }}
            >
              {event.priority || 'Alta'}
            </span>
          </div>
        </div>
      </div>

      {/* Modal de expansão */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
          <div className="modal-content" onClick={handleModalClick}>
            {/* Header do Modal */}
            <div className="modal-header">
              <h2 className="modal-title">{event.title}</h2>
              <button 
                className="modal-close-button"
                onClick={handleCloseModal}
                title="Fechar"
              >
                × 
              </button>
            </div>
 
            {/* Conteúdo do Modal */}
            <div className="modal-body">
              {/* Informações principais */}
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} /*  Alinhamento e espaçamento*/>
                    <CalendarDaysIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} /> {/*  Ícone Heroicon inserido */} 
                  </span>
                  <span className="modal-info-value">{formatDateRange(event.startDate, event.endDate)}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label"style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}> 
                    <UserGroupIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} /> {/*  Ícone Heroicon inserido */}
                    Responsável:</span>
                  <span className="modal-info-value">{event.requester || 'N/A'}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label"style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <UserIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} /> {/*  Ícone Heroicon inserido */} 
                    Organizador:</span>
                  <span className="modal-info-value">{event.organizer || 'N/A'}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <MapPinIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} /> {/*  Ícone Heroicon inserido */}  
                    Local:</span>
                  <span className="modal-info-value">{event.location || 'N/A'}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ExclamationTriangleIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} /> {/*  Ícone Heroicon inserido */}
                    Prioridade:</span>
                  <span 
                    className="modal-priority-badge"
                    style={{ color: getPriorityColor(event.priority || 'Alta') }}
                  >
                    {event.priority || 'Alta'}
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <TagIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} /> {/*  Ícone Heroicon inserido */} 
                    Tipo:</span>
                  <span className="modal-info-value">{event.type || 'N/A'}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ComputerDesktopIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} /> {/*  Ícone Heroicon inserido */} 
                    Formato:</span>
                  <span className="modal-info-value">{event.format || 'N/A'}</span>
                </div> 
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CurrencyDollarIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} /> {/*  Ícone Heroicon inserido */} 
                    Orçamento:</span>
                  <span className="modal-info-value">{formatBudget(event.estimatedBudget)}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <UsersIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} /> {/*  Ícone Heroicon inserido */} 
                    Participantes:</span>
                  <span className="modal-info-value">{event.estimatedParticipants || 'N/A'}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CubeIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} /> {/*  Ícone Heroicon inserido */} 
                    Centro de Custo:</span>
                  <span className="modal-info-value">{event.costCenter || 'N/A'}</span>
                </div>
              </div>

              {/* Dropdown de Descrição Completa */}
              <button 
                className="modal-dropdown-header"
                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
              >
                <span className="modal-dropdown-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Descrição Completa</span>
                  {/* ✅ Ícone substituindo a seta ▼ */}
                    <ChevronDownIcon
                      style={{ width: '16px', height: '16px' }} // 🔧 Ajuste direto via inline style
                        className={`text-gray-500 transition-transform duration-200 ${descriptionExpanded ? 'rotate-180' : ''}`} />
                       </button>
              {descriptionExpanded && (
                <div className="modal-dropdown-content">
                  <div className="modal-description-item">
                    <span className="modal-description-text">{event.description || 'Descrição do evento não disponível.'}</span>
                  </div>
                </div>
              )}

              {/* ✅ NOVO: Dropdown de Check List Aprimorado */}
              <button 
                className="modal-dropdown-header"
                onClick={() => setChecklistExpanded(!checklistExpanded)}
              >
                <span className="modal-dropdown-title">Check List</span>
                <ChevronDownIcon
                  style={{ width: '16px', height: '16px' }}
                  className={`text-gray-500 transition-transform duration-200 ${checklistExpanded ? 'rotate-180' : ''}`} 
                />
              </button>
              {checklistExpanded && (
                <div className="modal-dropdown-content">
                  {checklistItems.map(item => (
                    <div key={item.id} className="modal-checklist-item">
                      <input 
                        type="checkbox" 
                        checked={item.completed}
                        onChange={() => toggleChecklistItem(item.id)}
                      />
                      <span>{item.text}</span>
                      
                      {/* ✅ NOVO: Área de controles que aparece no hover */}
                      <div className="checklist-controls">
                        {/* Botão X para remover */}
                        <button 
                          className="remove-checklist-button"
                          onClick={() => removeChecklistItem(item.id)}
                          title="Remover item"
                        >
                          <XMarkIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                        
                        {/* Avatar do responsável OU botão de atribuir */}
                        {item.responsible ? (
                          <div 
                            className="assigned-avatar"
                            onClick={() => removeResponsible(item.id)}
                            title={`Responsável: ${item.responsible.name} (clique para remover)`}
                          >
                            {item.responsible.initials}
                          </div>
                        ) : (
                          <div className="assign-responsible-dropdown">
                            <button className="assign-responsible-button">
                              Atribuir responsável
                            </button>
                            <div className="assign-dropdown-menu">
                              {availableMembers.map(member => (
                                <button
                                  key={member.id}
                                  className="assign-dropdown-item"
                                  onClick={() => assignResponsible(item.id, member)}
                                >
                                  <span className="member-avatar-small">{member.initials}</span>
                                  {member.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <button 
                    className="modal-add-checklist-button"
                    onClick={addChecklistItem}
                  >
                    + Adicionar Item
                  </button>
                </div>
              )}

              {/* Seção de Comentários */}
              <button 
                className="modal-dropdown-header"
                onClick={() => setCommentsExpanded(!commentsExpanded)}
              >
                <span className="modal-dropdown-title"> Comentários</span>
                {/* ✅ Ícone substituindo a seta ▼ */}
                    <ChevronDownIcon
                      style={{ width: '16px', height: '16px' }} // 🔧 Ajuste direto via inline style
                        className={`text-gray-500 transition-transform duration-200 ${commentsExpanded ? 'rotate-180' : ''}`} />
              </button>
              {commentsExpanded && (
                <div className="modal-dropdown-content">
                  {comments[event.id] && comments[event.id].length > 0 ? (
                    comments[event.id].map(comment => (
                      <div key={comment.id} className="modal-comment-item">
                        <div className="modal-comment-header">
                          <div className="modal-member-avatar">
                            <span className="modal-member-initials">
                              {comment.author.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </span>
                          </div>
                          <div className="modal-comment-text-header">
                            <span className="modal-comment-author">{comment.author}</span>
                            <span className="modal-comment-time">{comment.timestamp}</span>
                          </div>
                        </div>
                        <p className="modal-comment-text">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="modal-no-comments">Nenhum comentário ainda.</p>
                  )}
                  
                  <div className="modal-add-comment-container">
                    <textarea
                      className="modal-comment-input"
                      placeholder="Adicione um comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows="3"
                    ></textarea>
                    <button 
                      className="modal-send-comment-button"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              )}

              {/* Seção de Membros da Equipe */}
              <div className="modal-members-section">
                <div className="modal-members-header">
                  <h3 className="modal-section-title">👥 Membros da Equipe</h3>
                  <div className="modal-add-member-container" style={{ position: 'relative' }}>
                    <button 
                      className="modal-add-member-button"
                      onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                    >
                      + Adicionar Membro
                    </button>
                    
                    {showMemberDropdown && (
                      <div className="member-dropdown-menu" style={{
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        minWidth: '200px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {availableMembers
                          .filter(member => !assignedMembers.find(assigned => assigned.id === member.id))
                          .map(member => (
                            <button
                              key={member.id}
                              className="member-dropdown-item"
                              onClick={() => {
                                addEventMember(member);
                                setShowMemberDropdown(false);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                fontSize: '14px',
                                textAlign: 'left'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              <div 
                                className="member-avatar-small" 
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: '#4a6da7',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: 'bold'
                                }}
                              >
                                {member.initials}
                              </div>
                              {member.name}
                            </button>
                          ))
                        }
                        {availableMembers.filter(member => !assignedMembers.find(assigned => assigned.id === member.id)).length === 0 && (
                          <div style={{ padding: '12px', color: '#888', fontSize: '14px', textAlign: 'center' }}>
                            Todos os membros já foram adicionados
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-members-list">
                  {assignedMembers.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#888' }}>Nenhum membro atribuído ainda.</p>
                  ) : (
                    assignedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="modal-member-item"
                        onMouseEnter={() => setHovered(member.id)}
                        onMouseLeave={() => setHovered(null)}
                        style={{ position: 'relative' }}
                      >
                        <div className="modal-member-avatar" style={{ backgroundColor: '#4a6da7' }}>
                          {member.initials}
                        </div>
                        <div className="modal-member-info">
                          <span className="modal-member-name">{member.name}</span>
                          <span className="modal-member-role">Membro</span>
                        </div>

                        {/* Botão X visível ao passar o mouse */}
                        {hovered === member.id && (
                          <button
                            className="modal-remove-member-button"
                            onClick={() => removeEventMember(member.id)}
                            title="Remover membro"
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'transparent',
                              border: 'none',
                              color: '#e74c3c',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}