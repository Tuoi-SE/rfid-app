import { Plus } from 'lucide-react';

export const DashboardWarehouseWidget = () => {
  return (
    <section className="mt-auto">
      <div className="w-full aspect-video rounded-3xl bg-slate-800 relative overflow-hidden shadow-lg group cursor-pointer">
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1000&auto=format&fit=crop"
          alt="Warehouse"
          className="w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors">
          <Plus className="w-4 h-4" />
        </div>
        <div className="absolute bottom-4 left-5 right-5">
          <h3 className="text-white font-bold text-sm mb-0.5 shadow-sm">Kho trung tâm (Hà Nội)</h3>
          <p className="text-white/80 text-[11px] font-medium flex items-center gap-2">
            <span>Sức chứa: 85%</span>
            <span className="w-1 h-1 rounded-full bg-white/50"></span>
            <span>Nhiệt độ: 24°C</span>
          </p>
        </div>
      </div>
    </section>
  );
};
