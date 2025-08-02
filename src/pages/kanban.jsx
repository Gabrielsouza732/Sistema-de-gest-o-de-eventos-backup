import React, { useState, useEffect } from "react";
import "../styles/Kanban.css";
import initialData from "../data/initialData";
import { useNavigate } from "react-router-dom";
import KanbanCard from "../components/KanbanCard";
import SearchFilter from "../components/SearchFilter";
import {
  DndContext,
  closestCorners,
  useSensors,
  PointerSensor,
  useSensor,
  DragOverlay,
  useDroppable
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// Componente para área de drop em colunas vazias
function DroppableColumn({ children, id }) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div ref={setNodeRef} className="droppable-column">
      {children}
    </div>
  );
}

export default function Kanban() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [eventsState, setEventsState] = useState({
    pending: [],
    inProgress: [],
    completed: [],
  });
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    setEventsState(initialData.events);
  }, []);

  const allEvents = [
    ...eventsState.pending,
    ...eventsState.inProgress,
    ...eventsState.completed,
  ];

  const formatDateForSearch = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR");
  };

  const filteredEvents = allEvents.filter((event) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();

    const searchableFields = [
      String(event.title || ""),
      String(event.description || ""),
      String(event.responsible || ""),
      String(event.priority || ""),
      String(event.type || ""),
      String(event.format || ""),
      String(event.organizer || ""),
      String(event.location || ""),
      String(event.costCenter || ""),
      String(event.requester || ""),
      formatDateForSearch(event.startDate),
      formatDateForSearch(event.endDate),
    ];

    return searchableFields.some((field) =>
      field.toLowerCase().includes(searchLower)
    );
  });

  const columns = {
    Aguardando: filteredEvents.filter((event) =>
      eventsState.pending.some((e) => e.id === event.id)
    ),
    "Em execução": filteredEvents.filter((event) =>
      eventsState.inProgress.some((e) => e.id === event.id)
    ),
    Concluído: filteredEvents.filter((event) =>
      eventsState.completed.some((e) => e.id === event.id)
    ),
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  // Função para encontrar em qual coluna um item está
  const findContainer = (id) => {
    // Primeiro verifica se é um ID de coluna
    if (id === 'Aguardando' || id === 'Em execução' || id === 'Concluído') {
      return id;
    }

    // Depois verifica se é um item dentro de uma coluna
    if (eventsState.pending.find(item => item.id === id)) {
      return 'Aguardando';
    }
    if (eventsState.inProgress.find(item => item.id === id)) {
      return 'Em execução';
    }
    if (eventsState.completed.find(item => item.id === id)) {
      return 'Concluído';
    }

    return null;
  };

  // Mapear nomes de colunas para chaves do estado
  const getStateKey = (columnName) => {
    switch (columnName) {
      case 'Aguardando': return 'pending';
      case 'Em execução': return 'inProgress';
      case 'Concluído': return 'completed';
      default: return null;
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer) return;

    const activeStateKey = getStateKey(activeContainer);
    const overStateKey = getStateKey(overContainer);

    if (!activeStateKey || !overStateKey) return;

    if (activeContainer === overContainer) {
      // Reordenação dentro da mesma coluna
      setEventsState((prev) => {
        const items = [...prev[activeStateKey]];
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(items, oldIndex, newIndex);
          return {
            ...prev,
            [activeStateKey]: newOrder,
          };
        }
        return prev;
      });
    } else {
      // Movimento entre colunas diferentes
      setEventsState((prev) => {
        const activeItems = [...prev[activeStateKey]];
        const overItems = [...prev[overStateKey]];
        
        const activeIndex = activeItems.findIndex(item => item.id === active.id);
        
        if (activeIndex !== -1) {
          const [movedItem] = activeItems.splice(activeIndex, 1);
          
          // Se o over é um item específico, insere antes dele
          // Se o over é a coluna, adiciona no final
          const overIndex = overItems.findIndex(item => item.id === over.id);
          if (overIndex !== -1) {
            overItems.splice(overIndex, 0, movedItem);
          } else {
            overItems.push(movedItem);
          }
          
          return {
            ...prev,
            [activeStateKey]: activeItems,
            [overStateKey]: overItems,
          };
        }
        return prev;
      });
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Permite movimento entre colunas durante o drag
    const activeStateKey = getStateKey(activeContainer);
    const overStateKey = getStateKey(overContainer);

    if (!activeStateKey || !overStateKey) return;

    setEventsState((prev) => {
      const activeItems = [...prev[activeStateKey]];
      const overItems = [...prev[overStateKey]];

      const activeIndex = activeItems.findIndex(item => item.id === active.id);
      const overIndex = overItems.findIndex(item => item.id === over.id);

      if (activeIndex !== -1) {
        const [movedItem] = activeItems.splice(activeIndex, 1);
        
        if (overIndex !== -1) {
          overItems.splice(overIndex, 0, movedItem);
        } else {
          overItems.push(movedItem);
        }

        return {
          ...prev,
          [activeStateKey]: activeItems,
          [overStateKey]: overItems,
        };
      }
      return prev;
    });
  };

  const handleSearch = (text) => {
    setSearchText(text);
  };

  // Encontrar o item ativo para o DragOverlay
  const activeItem = activeId ? allEvents.find(item => item.id === activeId) : null;

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <button className="kanban-back-button" onClick={() => navigate("/")}>
          ←
        </button>
        <h1>Quadro Kanban</h1>
      </div>

      <SearchFilter onSearch={handleSearch} placeholder="Pesquisar eventos..." />

      <div className="kanban-page-header">
        <h2 className="kanban-page-title">Eventos</h2>
        <button className="kanban-add-button" onClick={() => navigate("/form")}>
          + Novo
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {Object.entries(columns).map(([columnId, events]) => (
            <DroppableColumn key={columnId} id={columnId}>
              <div className="kanban-column" data-column={columnId}>
                <div className="kanban-column-header">
                  <h3>{columnId}</h3>
                  <span className="kanban-column-count">{events.length}</span>
                </div>
                <SortableContext
                  items={events.map((e) => e.id)}
                  id={columnId}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="kanban-cards">
                    {events.length > 0 ? (
                      events.map((event) => (
                        <KanbanCard
                          key={event.id}
                          event={event}
                          column={columnId}
                        />
                      ))
                    ) : (
                      <div className="empty-column-drop-zone">
                        <p className="no-kanban-results">
                          Nenhum evento encontrado nesta coluna.
                        </p>
                        <p className="drop-hint">
                          Arraste um card aqui para movê-lo para esta coluna
                        </p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            </DroppableColumn>
          ))}
        </div>
        
        <DragOverlay>
          {activeItem ? (
            <KanbanCard event={activeItem} column="dragging" />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}