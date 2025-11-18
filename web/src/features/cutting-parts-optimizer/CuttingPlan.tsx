'use client';

import React, { useEffect, useRef, useState } from 'react';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as d3 from 'd3';

import { PlacedPart, SheetResult } from '@/shared/api/optimizer.dto';
import { Button, Card, CardContent, Slider } from '@/shared/ui/shadcn';

interface CuttingPlanProps {
  sheets: SheetResult[];
}

// Константы для печати (в миллиметрах)
const PRINT_CONSTANTS = {
  PAGE_WIDTH: 297,
  PAGE_HEIGHT: 210,
  MARGIN: 10,
  SHEET_GAP: 15,
  START_SCALE: 0.038,
  FONT_START_SCALE: 1,
  PART_FILL_COLOR: '#b8c2cc',
  PART_BORDER_COLOR: '#475569',
  PART_BORDER_WIDTH: 0.2,
  PART_TEXT_COLOR: '#1e293b',
};

const FONT_SCALES = {
  partsDescription: 80,
  sheetSize: 90,
  utilizationRate: 100,
};

const CuttingPlan: React.FC<CuttingPlanProps> = ({ sheets }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPart, setSelectedPart] = useState<PlacedPart | null>(null);
  const [tooltipInfo, setTooltipInfo] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);
  const [scale, setScale] = useState(PRINT_CONSTANTS.START_SCALE);
  const [fontScale, setFontScale] = useState(PRINT_CONSTANTS.FONT_START_SCALE);

  useEffect(() => {
    if (!sheets.length || !containerRef.current) return;

    // Сортировка листов по цвету и толщине
    const sortedSheets = [...sheets].sort((a, b) => {
      const keyA = `${a.color}-${a.thickness}`;
      const keyB = `${b.color}-${b.thickness}`;
      return keyA.localeCompare(keyB);
    });

    const container = d3.select(containerRef.current);
    container.selectAll('*').remove();

    // Создаем массив страниц
    const pages: { sheet: SheetResult; x: number; y: number }[][] = [];
    let currentPage: { sheet: SheetResult; x: number; y: number }[] = [];
    let currentX = PRINT_CONSTANTS.MARGIN;
    let currentY = PRINT_CONSTANTS.MARGIN;
    let maxHeightInRow = 0;

    // Используем sortedSheets вместо sheets
    sortedSheets.forEach((sheet) => {
      const sheetLength = sheet.length * scale;
      const sheetWidth = sheet.width * scale;

      // Логика размещения листов на страницах
      if (currentX + sheetLength > PRINT_CONSTANTS.PAGE_WIDTH - PRINT_CONSTANTS.MARGIN * 2) {
        currentX = PRINT_CONSTANTS.MARGIN;
        currentY += maxHeightInRow + PRINT_CONSTANTS.SHEET_GAP;
        maxHeightInRow = 0;
      }

      if (currentY + sheetWidth > PRINT_CONSTANTS.PAGE_HEIGHT - PRINT_CONSTANTS.MARGIN * 2) {
        pages.push(currentPage);
        currentPage = [];
        currentX = PRINT_CONSTANTS.MARGIN;
        currentY = PRINT_CONSTANTS.MARGIN;
        maxHeightInRow = 0;
      }

      currentPage.push({ sheet, x: currentX, y: currentY });
      currentX += sheetLength + PRINT_CONSTANTS.SHEET_GAP;
      maxHeightInRow = Math.max(maxHeightInRow, sheetWidth);
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    // Генерируем SVG для каждой страницы
    pages.forEach((pageSheets) => {
      const pageDiv = container
        .append('div')
        .attr('class', 'page')
        .style('width', `${PRINT_CONSTANTS.PAGE_WIDTH}mm`)
        .style('height', `${PRINT_CONSTANTS.PAGE_HEIGHT - PRINT_CONSTANTS.MARGIN}mm`)
        .style('overflow', 'hidden');

      const svg = pageDiv
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${PRINT_CONSTANTS.PAGE_WIDTH} ${PRINT_CONSTANTS.PAGE_HEIGHT}`);

      pageSheets.forEach(({ sheet, x, y }) => {
        const sheetGroup = svg.append('g').attr('transform', `translate(${x}, ${y})`);

        // Отрисовка фона листа
        sheetGroup
          .append('rect')
          .attr('width', sheet.length * scale)
          .attr('height', sheet.width * scale)
          .attr('fill', '#f8fafc')
          .attr('stroke', '#64748b')
          .attr('stroke-width', 0.2);

        // Размеры листа
        sheetGroup
          .append('text')
          .attr('x', (sheet.length * scale) / 2)
          .attr('y', -6)
          .attr('text-anchor', 'middle')
          .attr('font-size', `${scale * FONT_SCALES.sheetSize * fontScale}px`)
          .text(`${sheet.length}x${sheet.width}`);

        sheetGroup
          .append('text')
          .attr('x', (sheet.length * scale) / 2)
          .attr('y', -2)
          .attr('text-anchor', 'middle')
          .attr('font-size', `${scale * FONT_SCALES.sheetSize * fontScale}px`)
          .text(`${sheet.color} ${sheet.thickness}`);

        // Отрисовка деталей
        sheet.parts.forEach((part) => {
          const partGroup = sheetGroup
            .append('g')
            .attr('class', 'part')
            .attr('transform', `translate(${part.x * scale}, ${part.y * scale})`);

          partGroup
            .append('rect')
            .attr('width', part.rotated ? part.width * scale : part.length * scale)
            .attr('height', part.rotated ? part.length * scale : part.width * scale)
            .attr('fill', PRINT_CONSTANTS.PART_FILL_COLOR)
            // .attr('fill', materialColors[sheet.color] || '#94a3b8')
            .attr('stroke', PRINT_CONSTANTS.PART_BORDER_COLOR)
            .attr('stroke-width', PRINT_CONSTANTS.PART_BORDER_WIDTH)
            .attr('cursor', 'pointer')
            .on('mouseover', (event) => {
              d3.select(event.currentTarget).attr('stroke', '#2563eb').attr('stroke-width', 0.3);
              setTooltipInfo({
                x: event.pageX,
                y: event.pageY,
                content: `Id: ${part.id}\nРазмер: ${part.length} x ${part.width} мм\nПлощадь: ${part.square / 1000000} мм2\nМетка: ${part.label}\nНазвание: ${part.description}\nЦвет: ${sheet.color}\nТолщина: ${sheet.thickness}`,
              });
            })
            .on('mouseout', (event) => {
              d3.select(event.currentTarget)
                .attr('stroke', PRINT_CONSTANTS.PART_BORDER_COLOR)
                .attr('stroke-width', PRINT_CONSTANTS.PART_BORDER_WIDTH);
              setTooltipInfo(null);
            })
            .on('click', () => setSelectedPart(part));

          const text = partGroup
            .append('text')
            .attr('x', part.rotated ? (part.width * scale) / 2 : (part.length * scale) / 2)
            .attr('y', part.rotated ? (part.length * scale) / 2 : (part.width * scale) / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', `${scale * FONT_SCALES.partsDescription * fontScale}px`)
            .attr('fill', PRINT_CONSTANTS.PART_TEXT_COLOR)
            .text(`${part.length}x${part.width} ${part.label}`);

          if (part.rotated) {
            text.attr(
              'transform',
              `rotate(270, ${(part.width * scale) / 2}, ${(part.length * scale) / 2})`,
            );
          }
        });
      });
    });
  }, [sheets, scale, fontScale]);

  const handlePrint = () => {
    if (!containerRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const containerHtml = containerRef.current.innerHTML;
    const styles = `
      <style>
        @page {
          size: A4 landscape;
          margin: ${PRINT_CONSTANTS.MARGIN}mm;
        }
        body {
          margin: 0;
          padding: 0;
        }
        .page {
          width: ${PRINT_CONSTANTS.PAGE_WIDTH}mm;
          height: ${PRINT_CONSTANTS.PAGE_HEIGHT}mm;
          overflow: hidden;
          page-break-after: always;
        }
        .page:last-child {
          page-break-after: auto;
        }
        svg {
          width: 100%;
          height: 100%;
        }
        svg text {
          font-family: Arial, sans-serif;
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Раскрой</title>
          ${styles}
        </head>
        <body>
          ${containerHtml}
          <script>
            window.onload = function() {
              window.print();
            }
            window.onafterprint = function() {
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      {/* Кнопка и слайдеры */}
      <div className="flex items-center justify-between">
        <Button
          onClick={handlePrint}
          className="rounded-lg px-4 py-2 shadow-md"
          variant={'secondary'}
        >
          <FontAwesomeIcon icon={faPrint} />
          Печать
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">
              Масштаб: {((scale / PRINT_CONSTANTS.START_SCALE) * 100).toFixed(0)}%
            </span>
            <Slider
              value={[scale]}
              onValueChange={(value) => setScale(value[0])}
              min={0.02}
              max={0.05}
              step={0.001}
              className="w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">
              Шрифт: {((fontScale / PRINT_CONSTANTS.FONT_START_SCALE) * 100).toFixed(0)}%
            </span>
            <Slider
              value={[fontScale]}
              onValueChange={(value) => setFontScale(value[0])}
              min={0.5}
              max={1.4}
              step={0.1}
              className="w-32"
            />
          </div>
        </div>
      </div>

      {/* Контейнер страниц */}
      <div className="rounded-lg border p-4 shadow-md">
        <div
          ref={containerRef}
          className="pages-container"
          style={{ width: '100%', overflowX: 'auto' }}
        />
      </div>

      {tooltipInfo && (
        <div
          className="absolute rounded bg-white p-2 text-sm shadow-lg"
          style={{
            left: tooltipInfo.x + 10,
            top: tooltipInfo.y + 10,
            pointerEvents: 'none',
          }}
        >
          <pre className="whitespace-pre-wrap">{tooltipInfo.content}</pre>
        </div>
      )}

      {/* Карточка с информацией о детали */}
      {selectedPart && (
        <Card className="mt-4 rounded-lg shadow-md">
          <CardContent className="p-4">
            <h3 className="mb-2 font-semibold">Выделенная деталь</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>ID: {selectedPart.id}</div>
              <div>Цвет: {selectedPart.color}</div>
              <div>Толщина: {selectedPart.thickness}</div>
              <div>
                Размер: {selectedPart.length} мм x {selectedPart.width} мм
              </div>
              <div>Площадь: {selectedPart.square / 10000} м²</div>
              <div>
                Позиция: ({selectedPart.x}, {selectedPart.y})
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CuttingPlan;
