import React, { useState, useEffect } from 'react';
import './KanbanCard.css';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateEvent } from '../services/api';
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
  const [eventData, setEventData] = useState(event);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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
    const year = String(date.getFullYear()).slice(-2);
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

  // ✅ NOVO: Função para iniciar edição
  const startEditing = (field, currentValue) => {
    setEditingField(field);
    setEditingValue(currentValue || '');
  };

  // ✅ NOVO: Função para cancelar edição
  const cancelEditing = () => {
    setEditingField(null);
    setEditingValue('');
  };

  // ✅ NOVO: Função para salvar edição
  const saveEdit = async () => {
    if (editingField && editingValue !== eventData[editingField]) {
      setIsUpdating(true);
      try {
        const updatedData = { [editingField]: editingValue };
        await updateEvent(eventData.id, updatedData);
        setEventData(prev => ({ ...prev, [editingField]: editingValue }));
        console.log(`✅ Campo ${editingField} atualizado para: ${editingValue}`);
      } catch (error) {
        console.error('Erro ao atualizar evento:', error);
        // Rollback em caso de erro
      } finally {
        setIsUpdating(false);
      }
    }
    cancelEditing();
  };

  // ✅ NOVO: Função para lidar com teclas
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // ✅ NOVO: Componente para campo editável
  const EditableField = ({ field, value, children, isTextarea = false }) => {
    if (editingField === field) {
      const InputComponent = isTextarea ? 'textarea' : 'input';
      return (
        <InputComponent
          type={isTextarea ? undefined : 'text'}
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyPress}
          autoFocus
          className="inline-edit-input"
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            font: 'inherit',
            color: 'inherit',
            outline: 'none',
            resize: isTextarea ? 'vertical' : 'none',
            minHeight: isTextarea ? '60px' : 'auto'
          }}
        />
      );
    }

    return (
      <span
        onDoubleClick={() => startEditing(field, value)}
        style={{ cursor: 'text' }}
        title="Duplo clique para editar"
      >
        {children}
      </span>
    );
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

    if (!item.completed && eventData.endDate) {
      const deadline = new Date(eventData.endDate);
      const now = new Date();
      const msInDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.floor((deadline - now) / msInDay);

      if (diffDays === 1 && item.responsible) {
        console.log('⏰ Enviar lembrete: item não concluído com prazo próximo', {
          item: item.text,
          responsavel: item.responsible.name,
          prazoFinal: eventData.endDate
      });
    }
  }
  });
}, [checklistItems, eventData.endDate]);

  
  
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
        [eventData.id]: [...(prev[eventData.id] || []), newCommentObj]
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
          <h4 className="card-title">
            <EditableField field="title" value={eventData.title}>
              {eventData.title}
            </EditableField>
          </h4>
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
            <span className="info-value">{formatDateRange(eventData.startDate, eventData.endDate)}</span>
          </div>

          <div className="info-item">
            <span className="info-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '4px' }}>
              <UserIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </span>
            <span className="info-label">Responsável:</span>
            <span className="info-value">
              <EditableField field="requester" value={eventData.requester}>
                {eventData.requester || 'N/A'}
              </EditableField>
            </span>
          </div>

          <div className="info-item">
            <span className="info-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '4px' }}>
              <ExclamationTriangleIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </span>
            <span className="info-label">Prioridade:</span>
            <span 
              className="priority-badge"
              style={{ color: getPriorityColor(eventData.priority || 'Alta') }}
            >
              {eventData.priority || 'Alta'}
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
              <h2 className="modal-title">
                <EditableField field="title" value={eventData.title}>
                  {eventData.title}
                </EditableField>
              </h2>
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
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarDaysIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    Data:
                  </span>
                  <span className="modal-info-value">{formatDateRange(eventData.startDate, eventData.endDate)}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}> 
                    <UserGroupIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    Responsável:
                  </span>
                  <span className="modal-info-value">
                    <EditableField field="requester" value={eventData.requester}>
                      {eventData.requester || 'N/A'}
                    </EditableField>
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <UserIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    Organizador:
                  </span>
                  <span className="modal-info-value">
                    <EditableField field="organizer" value={eventData.organizer}>
                      {eventData.organizer || 'N/A'}
                    </EditableField>
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <MapPinIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    Local:
                  </span>
                  <span className="modal-info-value">
                    <EditableField field="location" value={eventData.location}>
                      {eventData.location || 'N/A'}
                    </EditableField>
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ExclamationTriangleIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    Prioridade:
                  </span>
                  <span 
                    className="modal-priority-badge"
                    style={{ color: getPriorityColor(eventData.priority || 'Alta') }}
                  >
                    {eventData.priority || 'Alta'}
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <TagIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    Tipo:
                  </span>
                  <span className="modal-info-value">
                    <EditableField field="eventType" value={eventData.eventType}>
                      {eventData.eventType || 'N/A'}
                    </EditableField>
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ComputerDesktopIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    Formato:
                  </span>
                  <span className="modal-info-value">
                    <EditableField field="eventFormat" value={eventData.eventFormat}>
                      {eventData.eventFormat || 'N/A'}
                    </EditableField>
                  </span>
                </div> 
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CurrencyDollarIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    Orçamento:
                  </span>
                  <span className="modal-info-value">
                    <EditableField field="estimatedBudget" value={eventData.estimatedBudget}>
                      {formatBudget(eventData.estimatedBudget)}
                    </EditableField>
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <UsersIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    Participantes:
                  </span>
                  <span className="modal-info-value">
                    <EditableField field="estimatedAttendees" value={eventData.estimatedAttendees}>
                      {eventData.estimatedAttendees || 'N/A'}
                    </EditableField>
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CubeIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    Centro de Custo:
                  </span>
                  <span className="modal-info-value">
                    <EditableField field="costCenter" value={eventData.costCenter}>
                      {eventData.costCenter || 'N/A'}
                    </EditableField>
                  </span>
                </div>
              </div>

              {/* Dropdown de Descrição Completa */}
              <button 
                className="modal-dropdown-header"
                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
              >
                <span className="modal-dropdown-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Descrição Completa
                </span>
                <ChevronDownIcon
                  style={{ width: '16px', height: '16px' }}
                  className={`text-gray-500 transition-transform duration-200 ${descriptionExpanded ? 'rotate-180' : ''}`} 
                />
              </button>
              {descriptionExpanded && (
                <div className="modal-dropdown-content">
                  <div className="modal-description-item">
                    <EditableField field="description" value={eventData.description} isTextarea={true}>
                      <span className="modal-description-text">
                        {eventData.description || 'Nenhuma descrição disponível.'}
                      </span>
                    </EditableField>
                  </div>
                </div>
              )}

              {/* Dropdown de Check List */}
              <button 
                className="modal-dropdown-header"
                onClick={() => setChecklistExpanded(!checklistExpanded)}
              >
                <span className="modal-dropdown-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <ClipboardDocumentListIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                  Check List
                </span>
                <ChevronDownIcon
                  style={{ width: '16px', height: '16px' }}
                  className={`text-gray-500 transition-transform duration-200 ${checklistExpanded ? 'rotate-180' : ''}`} 
                />
              </button>
              {checklistExpanded && (
                <div className="modal-dropdown-content">
                  <div className="modal-checklist">
                    {checklistItems.map((item) => (
                      <div key={item.id} className="modal-checklist-item">
                        <div className="checklist-item-main">
                          <input
                            type="checkbox"
                            id={`checklist-${item.id}`}
                            checked={item.completed}
                            onChange={() => toggleChecklistItem(item.id)}
                            className="checklist-checkbox"
                          />
                          <label 
                            htmlFor={`checklist-${item.id}`}
                            className={`checklist-label ${item.completed ? 'completed' : ''}`}
                          >
                            {item.text}
                          </label>
                          
                          {/* Responsável */}
                          <div className="checklist-responsible">
                            {item.responsible ? (
                              <div className="responsible-assigned">
                                <div className="responsible-avatar">
                                  {item.responsible.initials}
                                </div>
                                <button
                                  className="remove-responsible-button"
                                  onClick={() => removeResponsible(item.id)}
                                  title="Remover responsável"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <select
                                className="assign-responsible-button"
                                onChange={(e) => {
                                  const memberId = parseInt(e.target.value);
                                  const member = availableMembers.find(m => m.id === memberId);
                                  if (member) {
                                    assignResponsible(item.id, member);
                                  }
                                  e.target.value = '';
                                }}
                                defaultValue=""
                              >
                                <option value="" disabled>Atribuir responsável</option>
                                {availableMembers.map(member => (
                                  <option key={member.id} value={member.id}>
                                    {member.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                        
                        {/* Botão de remover item */}
                        <button
                          className="remove-checklist-button"
                          onClick={() => removeChecklistItem(item.id)}
                          title="Remover item"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    {/* Botão para adicionar novo item */}
                    <button 
                      className="add-checklist-button"
                      onClick={addChecklistItem}
                    >
                      <PlusIcon style={{ width: '16px', height: '16px' }} />
                      Adicionar Item
                    </button>
                  </div>
                </div>
              )}

              {/* Dropdown de Atividade/Comentários */}
              <button 
                className="modal-dropdown-header"
                onClick={() => setCommentsExpanded(!commentsExpanded)}
              >
                <span className="modal-dropdown-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <ChatBubbleBottomCenterTextIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                  Atividade
                </span>
                <ChevronDownIcon
                  style={{ width: '16px', height: '16px' }}
                  className={`text-gray-500 transition-transform duration-200 ${commentsExpanded ? 'rotate-180' : ''}`} 
                />
              </button>
              {commentsExpanded && (
                <div className="modal-dropdown-content">
                  {/* Área de adicionar comentário */}
                  <div className="add-comment-section">
                    <div className="comment-input-container">
                      <div className="comment-avatar">
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <textarea
                        className="comment-input"
                        placeholder="Escreva um comentário..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows="3"
                      />
                    </div>
                    <button 
                      className="add-comment-button"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                    >
                      Comentar
                    </button>
                  </div>

                  {/* Lista de comentários */}
                  <div className="comments-list">
                    {(comments[eventData.id] || []).map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-avatar">
                          {comment.author.charAt(0).toUpperCase()}
                        </div>
                        <div className="comment-content">
                          <div className="comment-header">
                            <span className="comment-author">{comment.author}</span>
                            <span className="comment-timestamp">{comment.timestamp}</span>
                          </div>
                          <div className="comment-text">{comment.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seção de Membros da Equipe */}
              <div className="modal-members-section">
                <div className="modal-members-header">
                  <h3 className="modal-members-title">👥 Membros da Equipe</h3>
                  <div className="modal-add-member-container">
                    <button 
                      className="modal-add-member-button"
                      onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                    >
                      + Adicionar Membro
                    </button>
                    
                    {showMemberDropdown && (
                      <div className="modal-member-dropdown">
                        {availableMembers
                          .filter(member => !assignedMembers.find(assigned => assigned.id === member.id))
                          .map(member => (
                            <div 
                              key={member.id} 
                              className="modal-member-option"
                              onClick={() => {
                                addEventMember(member);
                                setShowMemberDropdown(false);
                              }}
                            >
                              <div className="modal-member-avatar">
                                {member.initials}
                              </div>
                              <span className="modal-member-name">{member.name}</span>
                            </div>
                          ))
                        }
                        {availableMembers.filter(member => !assignedMembers.find(assigned => assigned.id === member.id)).length === 0 && (
                          <div className="modal-no-members">
                            Todos os membros já foram adicionados
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="modal-members-list">
                  {assignedMembers.length > 0 ? (
                    assignedMembers.map(member => (
                      <div key={member.id} className="modal-member-item">
                        <div className="modal-member-info">
                          <div className="modal-member-avatar">
                            {member.initials}
                          </div>
                          <div className="modal-member-details">
                            <span className="modal-member-name">{member.name}</span>
                            <span className="modal-member-role">Membro da Equipe</span>
                          </div>
                        </div>
                        <button 
                          className="modal-remove-member-button"
                          onClick={() => removeEventMember(member.id)}
                          title="Remover membro"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="modal-no-members-assigned">
                      Nenhum membro atribuído ainda
                    </div>
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
