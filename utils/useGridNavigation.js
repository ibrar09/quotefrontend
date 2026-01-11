import { useRef } from 'react';

export const useGridNavigation = () => {
  const inputRefs = useRef([]);

  const register = (row, col, el) => {
    if (!inputRefs.current[row]) inputRefs.current[row] = [];
    inputRefs.current[row][col] = el;
  };

  const handleKey = (e, row, col) => {
    const grid = inputRefs.current;
    let nextRow = row;
    let nextCol = col;

    switch (e.key) {
      case 'ArrowRight':
      case 'Enter':
        nextCol += 1;
        break;
      case 'ArrowLeft':
        nextCol -= 1;
        break;
      case 'ArrowDown':
        nextRow += 1;
        break;
      case 'ArrowUp':
        nextRow -= 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    grid?.[nextRow]?.[nextCol]?.focus();
  };

  return { register, handleKey };
};
