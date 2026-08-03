import { register } from "../lib/charts/registry.mjs";
import { renderChartPng } from "../lib/charts/helpers.mjs";

register("revenue_trend", async (ctx) => {
  const rows = ctx.data.quarterly ?? [
    { month: "Jan", revenue_m: 4.2 },
    { month: "Feb", revenue_m: 4.5 },
    { month: "Mar", revenue_m: 4.8 },
    { month: "Apr", revenue_m: 5.1 },
    { month: "May", revenue_m: 5.4 },
    { month: "Jun", revenue_m: 5.9 },
  ];
  const months = rows.map((r) => r.month);
  const revenue = rows.map((r) => Number(r.revenue_m));
  const color = ctx.color(0);
  const lw = ctx.tokens.plot.linewidth ?? 2;
  const ms = ctx.tokens.plot.markersize ?? 6;

  return renderChartPng(ctx, () => ({
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "Revenue",
          data: revenue,
          borderColor: color,
          backgroundColor: color,
          borderWidth: lw,
          pointRadius: ms / 2,
          pointHoverRadius: ms / 2 + 1,
          tension: 0.15,
        },
      ],
    },
    options: {
      plugins: {
        title: { display: true, text: "Revenue trend" },
        legend: { position: "top", align: "start" },
      },
      scales: {
        x: {
          title: { display: true, text: "Month" },
        },
        y: {
          title: { display: true, text: "Revenue (M)" },
          grace: "12%",
        },
      },
    },
  }));
});
