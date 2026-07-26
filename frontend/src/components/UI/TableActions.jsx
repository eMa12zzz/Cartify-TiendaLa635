import React from 'react';
import styled from 'styled-components';
import { Edit2, Trash2, Eye } from 'lucide-react';

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ActionBtn = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $danger }) => ($danger ? '#ef4444' : '#6b7280')};
  transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out);
  padding: 6px;
  border-radius: 6px;

  &:hover {
    background: ${({ $danger }) => ($danger ? '#fef2f2' : '#f3f4f6')};
    color: ${({ $danger }) => ($danger ? '#dc2626' : '#374151')};
  }
`;

const TableActions = ({ onEdit, onDelete, onView }) => {
  return (
    <ActionsContainer onClick={(e) => e.stopPropagation()}>
      {onView && (
        <ActionBtn title="Ver detalle" onClick={(e) => { e.stopPropagation(); onView(); }}>
          <Eye size={18} />
        </ActionBtn>
      )}
      {onEdit && (
        <ActionBtn title="Editar" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          <Edit2 size={18} />
        </ActionBtn>
      )}
      {onDelete && (
        <ActionBtn $danger title="Eliminar" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 size={18} />
        </ActionBtn>
      )}
    </ActionsContainer>
  );
};

export default TableActions;
