# app/services/yahoo.py

import yfinance as yf
from functools import lru_cache
import time
from typing import Optional, Tuple
from datetime import datetime


# TTL Cache manual (pode ser substituído por Redis para produção real)
_cache = {}
_TTL = 60  # 1 minuto

def obter_cotacao_yf(ticker: str) -> Tuple[float, Optional[datetime]]:
    now = time.time()
    ticker = ticker if "." in ticker else ticker + ".SA"

    if ticker in _cache and now - _cache[ticker]['time'] < _TTL:
        return _cache[ticker]['value'], _cache[ticker]['date']

    try:
        data = yf.Ticker(ticker).history(period="1d", interval="1m")
        if not data.empty:
            cotacao = float(data["Close"].iloc[-1])
            data_cotacao = data.index[-1].to_pydatetime()
            _cache[ticker] = {"value": cotacao, "time": now, "date": data_cotacao}
            return cotacao, data_cotacao
        else:
            return 0.0, None
    except Exception as e:
        print(f"Erro ao buscar cotação de {ticker}: {e}")
        return 0.0, None

