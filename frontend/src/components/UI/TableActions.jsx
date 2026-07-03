import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';

const Container = styled.div`
  position: relative;
  display: inline-block;
`;

const TriggerButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;

  &:hover {
    background: #f0f0f0;
    color: #333;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 4px;
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 140px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: 4px 0;
`;

const ActionItem = styled.button`
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ $danger }) => ($danger ? '#ef4444' : '#333')};
  transition: background 0.2s;

  &:hover {
    background: ${({ $danger }) => ($danger ? '#fef2f2' : '#f5f5f5')};
  }
`;

const TableActions = ({ onEdit, onDelete, onView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (e, action) => {
    e.stopPropagation();
    setIsOpen(false);
    if (action) action();
  };

  return (
    <Container ref={containerRef}>
      <TriggerButton onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
        <MoreVertical size={18} />
      </TriggerButton>

      {isOpen && (
        <DropdownMenu onClick={(e) => e.stopPropagation()}>
          {onView && (
            <ActionItem onClick={(e) => handleAction(e, onView)}>
              <Eye size={16} /> Ver detalle
            </ActionItem>
          )}
          {onEdit && (
            <ActionItem onClick={(e) => handleAction(e, onEdit)}>
              <Edit2 size={16} /> Editar
            </ActionItem>
          )}
          {onDelete && (
            <ActionItem $danger onClick={(e) => handleAction(e, onDelete)}>
              <Trash2 size={16} /> Eliminar
            </ActionItem>
          )}
        </DropdownMenu>
      )}
    </Container>
  );
};

export default TableActions;
