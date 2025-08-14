import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ComparisonData } from '../types';

/**
 * Formata valores monetários em Real Brasileiro (BRL)
 */
export const currencyBRL = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formata números em formato compacto (K, M, B)
 */
export const numberFormat = (amount: number): string => {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}K`;
  }
  return amount.toFixed(0);
};

/**
 * Formata números completos com separadores de milhares
 */
export const numberFormatFull = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formata percentuais
 */
export const percentageFormat = (value: number, decimals: number = 1): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Formata variação percentual com sinal
 */
export const variationFormat = (value: number, decimals: number = 1): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${percentageFormat(value, decimals)}`;
};

/**
 * Formata datas no padrão brasileiro
 */
export const dateFormat = (date: string | Date, pattern: string = 'dd/MM/yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Data inválida';
    return format(dateObj, pattern, { locale: ptBR });
  } catch {
    return 'Data inválida';
  }
};

/**
 * Formata período (YYYY-MM) para exibição
 */
export const periodFormat = (period: string): string => {
  try {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, 'MMM/yyyy', { locale: ptBR });
  } catch {
    return period;
  }
};

/**
 * Formata período completo
 */
export const periodFormatFull = (period: string): string => {
  try {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, 'MMMM \\de yyyy', { locale: ptBR });
  } catch {
    return period;
  }
};

/**
 * Formata números para exibição em gráficos
 */
export const chartNumberFormat = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) {
    return numberFormat(value);
  }
  return numberFormatFull(value);
};

/**
 * Formata valores monetários para tooltips de gráficos
 */
export const chartCurrencyFormat = (value: number): string => {
  return currencyBRL(value);
};

/**
 * Determina a cor baseada no valor (positivo/negativo)
 */
export const getValueColor = (value: number): string => {
  if (value > 0) return 'text-green-600 dark:text-green-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
};

/**
 * Determina a cor de fundo baseada no valor
 */
export const getValueBgColor = (value: number): string => {
  if (value > 0) return 'bg-green-50 dark:bg-green-900/20';
  if (value < 0) return 'bg-red-50 dark:bg-red-900/20';
  return 'bg-gray-50 dark:bg-gray-900/20';
};

/**
 * Formata comparação de dados
 */
export const formatComparison = (comparison: ComparisonData): {
  variance: string;
  variancePercent: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
} => {
  return {
    variance: numberFormatFull(comparison.variance),
    variancePercent: variationFormat(comparison.variancePercent),
    trend: comparison.trend,
    color: getValueColor(comparison.variance),
  };
};

/**
 * Trunca texto com reticências
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Formata nome de conta para exibição hierárquica
 */
export const formatAccountName = (name: string, level: number): string => {
  const indent = '  '.repeat(level - 1);
  return `${indent}${name}`;
};

/**
 * Converte string para slug (URL-friendly)
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
};

/**
 * Formata tamanho de arquivo
 */
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
};

// Aliases para compatibilidade
export const formatCurrency = currencyBRL;
export const formatPercentage = percentageFormat;
export const formatNumber = numberFormatFull;
export const formatCompactNumber = numberFormat;
export const formatDate = dateFormat;
export const getVariationColor = getValueColor;

/**
 * Valida e formata CNPJ
 */
export const formatCNPJ = (cnpj: string): string => {
  const numbers = cnpj.replace(/\D/g, '');
  if (numbers.length !== 14) return cnpj;
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Valida e formata CPF
 */
export const formatCPF = (cpf: string): string => {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return cpf;
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};