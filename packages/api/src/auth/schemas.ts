import { Type } from '@sinclair/typebox';

export const SymbolParamSchema = Type.Object({
  symbol: Type.String({ minLength: 1, maxLength: 10, pattern: '^[a-zA-Z0-9]+$' })
});

export const SymbolsQuerySchema = Type.Object({
  symbols: Type.Optional(Type.String())
});

export const PriceDataPointSchema = Type.Object({
  timestamp: Type.String(),
  open: Type.Number(),
  high: Type.Number(),
  low: Type.Number(),
  close: Type.Number(),
  volume: Type.Number()
});

export const NewsItemSchema = Type.Object({
  title: Type.String(),
  url: Type.String({ format: 'uri' }),
  source: Type.String(),
  publishedAt: Type.String(),
  symbols: Type.Array(Type.String()),
  summary: Type.Optional(Type.String())
});

export const AnalysisBodySchema = Type.Object({
  priceHistory: Type.Array(PriceDataPointSchema, { minItems: 1 }),
  news: Type.Optional(Type.Array(NewsItemSchema))
});

export const SearchQuerySchema = Type.Object({
  q: Type.String({ minLength: 1, maxLength: 100 })
});

export const HistoryQuerySchema = Type.Object({
  interval: Type.Optional(Type.String({ default: '1day' })),
  from: Type.Optional(Type.String({ format: 'date-time' })),
  to: Type.Optional(Type.String({ format: 'date-time' }))
});

export const RegisterBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8, maxLength: 128 }),
  role: Type.Optional(Type.Enum({ admin: 'admin', user: 'user', service: 'service' }))
});

export const LoginBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String()
});

export const RefreshBodySchema = Type.Object({
  refreshToken: Type.String({ minLength: 1 })
});

export const CreateApiKeyBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  role: Type.Optional(Type.Enum({ admin: 'admin', user: 'user', service: 'service' })),
  expiresAt: Type.Optional(Type.String({ format: 'date-time' }))
});

export const ErrorSchema = Type.Object({
  error: Type.String(),
  message: Type.String()
});

export const ValidationErrorSchema = Type.Object({
  statusCode: Type.Number(),
  code: Type.String(),
  error: Type.String(),
  message: Type.String()
});
