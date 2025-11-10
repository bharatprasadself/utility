import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Stack, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { totalAnnualDividends } from '@/utils/finance';
import FinanceToolLayout from '@/components/finance/FinanceToolLayout';
import ResultCard from '@/components/finance/ResultCard';

type Holding = { symbol: string; shares: number; dividendPerShare: number };

export default function DividendTracker() {
  const [symbol, setSymbol] = useState('ACME');
  const [shares, setShares] = useState('10');
  const [dps, setDps] = useState('2.5');
  const [holdings, setHoldings] = useState<Holding[]>([]);

  const addHolding = () => {
    const s = symbol.trim();
    const sh = parseFloat(shares);
    const d = parseFloat(dps);
    if (!s || !isFinite(sh) || !isFinite(d)) return;
    setHoldings((prev) => [...prev, { symbol: s, shares: sh, dividendPerShare: d }]);
    setSymbol('');
    setShares('');
    setDps('');
  };

  const totalAnnual = totalAnnualDividends(holdings);

  const removeHolding = (index: number) => {
    setHoldings(prev => prev.filter((_, i) => i !== index));
  };

  const exportToCsv = () => {
    const headers = ['Symbol', 'Shares', 'DividendPerShare', 'AnnualIncome'];
    const rows = holdings.map(h => [
      h.symbol,
      h.shares,
      h.dividendPerShare,
      (h.shares * h.dividendPerShare).toFixed(2)
    ]);
    // Add totals row
    rows.push(['Total', '', '', totalAnnual.toFixed(2)]);

    const escape = (v: string | number) => {
      const s = String(v ?? '');
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };

    const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\r\n');
    // Prepend BOM for Excel UTF-8
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `dividend_tracker_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <FinanceToolLayout
      title="Dividend Tracker"
      icon="🧾"
      subtitle="Monitor holdings and their annual dividend yields."
      description="The Dividend Tracker helps you monitor your stock holdings and calculate total annual dividend income. Simply add each company’s symbol, number of shares, and dividend per share to estimate your passive income and track the overall performance of your dividend portfolio."
      sidebar={<ResultCard
        title="Total Annual Dividends"
        emoji="🧾"
        value={totalAnnual}
        format="number"
        decimals={2}
        description="Sum of all positions' annual dividend income."
      />}
    >
      <Card>
        <CardContent>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
            <TextField label="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} fullWidth />
            <TextField label="Shares" type="number" value={shares} onChange={(e) => setShares(e.target.value)} fullWidth />
            <TextField label="Dividend/Share (Annual)" type="number" value={dps} onChange={(e) => setDps(e.target.value)} fullWidth />
            <Button variant="contained" onClick={addHolding}>Add</Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={exportToCsv}
              disabled={holdings.length === 0}
              aria-disabled={holdings.length === 0}
            >
              Export to Excel
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell align="right">Shares</TableCell>
                <TableCell align="right">Dividend/Share</TableCell>
                <TableCell align="right">Annual Income</TableCell>
                <TableCell align="right" sx={{ width: 48 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holdings.map((h, idx) => (
                <TableRow key={idx}>
                  <TableCell>{h.symbol}</TableCell>
                  <TableCell align="right">{h.shares}</TableCell>
                  <TableCell align="right">{h.dividendPerShare}</TableCell>
                  <TableCell align="right">{(h.shares * h.dividendPerShare).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => removeHolding(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Total Annual</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{totalAnnual.toFixed(2)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </FinanceToolLayout>
  );
}
