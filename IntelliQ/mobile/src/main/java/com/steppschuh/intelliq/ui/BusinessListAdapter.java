package com.steppschuh.intelliq.ui;

import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.view.ViewGroup;

import com.steppschuh.intelliq.IntelliQ;
import com.steppschuh.intelliq.api.entry.BusinessEntry;
import com.steppschuh.intelliq.ui.widget.BusinessItemQueueView;
import com.steppschuh.intelliq.ui.widget.BusinessItemView;
import com.steppschuh.intelliq.ui.widget.StatusView;

import java.util.ArrayList;

public class BusinessListAdapter extends RecyclerView.Adapter<BusinessListAdapter.BusinessItemViewHolder> {

    private static final int TYPE_DEFAULT = 0;
    private static final int TYPE_ERROR = 1;

    IntelliQ app;
    ArrayList<BusinessEntry> businessEntries;
    StatusView statusView;

    private BusinessItemQueueView.OnItemClickListener onItemClickListener;

    public BusinessListAdapter(ArrayList<BusinessEntry> businessEntries) {
        this.businessEntries = businessEntries;
    }

    public void showStatusView(StatusView statusView) {
        if (getItemCount() == 1 && businessEntries == null) {
            // already showing a view_status view
            //this.notifyItemRemoved(0);
        }
        this.statusView = statusView;
        businessEntries = null;
        this.notifyItemChanged(0);
    }

    @Override
    public int getItemViewType(int position) {
        if (businessEntries != null && businessEntries.size() > 0) {
            return TYPE_DEFAULT;
        } else {
            return TYPE_ERROR;
        }
    }

    @Override
    public BusinessItemViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        app = ((IntelliQ) parent.getContext().getApplicationContext());
        View v;
        switch (viewType) {
            case TYPE_ERROR: {
                v = statusView;
                break;
            }
            default: {
                //v = LayoutInflater.from(app).inflate(R.layout.view_business_item, parent, false);
                v = new BusinessItemView(app);
                break;
            }
        }

        BusinessItemViewHolder businessItemViewHolder = new BusinessItemViewHolder(v, viewType);
        return businessItemViewHolder;
    }

    @Override
    public void onBindViewHolder(final BusinessItemViewHolder businessItemViewHolder, int position) {
        switch (businessItemViewHolder.getViewType()) {
            case TYPE_ERROR: {
                onBindErrorViewHolder(businessItemViewHolder, position);
                break;
            }
            default: {
                onBindDefaultViewHolder(businessItemViewHolder, position);
                break;
            }
        }
    }

    private void onBindDefaultViewHolder(final BusinessItemViewHolder businessViewHolder, int position) {
        final BusinessEntry businessEntry = businessEntries.get(position);

        if (businessEntry != null) {
            businessViewHolder.getBusinessItemView().setOnItemClickListener(onItemClickListener);
            businessViewHolder.getBusinessItemView().createFromBusinessEntry(businessEntry, app);
        }
    }

    private void onBindErrorViewHolder(final BusinessItemViewHolder businessItemViewHolder, int position) {

    }

    @Override
    public int getItemCount() {
        if (businessEntries != null && businessEntries.size() > 0) {
            return businessEntries.size();
        } else if (statusView != null) {
            // show the view_status view
            return 1;
        } else {
            return 0;
        }
    }

    public ArrayList<BusinessEntry> getBusinessEntries() {
        return businessEntries;
    }

    public void setBusinessEntries(ArrayList<BusinessEntry> businessEntries) {
        this.businessEntries = businessEntries;
    }

    public void setStatusView(StatusView statusView) {
        this.statusView = statusView;
    }

    public static class BusinessItemViewHolder extends RecyclerView.ViewHolder {

        private int viewType;
        private BusinessItemView businessItemView;

        BusinessItemViewHolder(View itemView, int viewType) {
            super(itemView);
            this.viewType = viewType;

            if (viewType == TYPE_DEFAULT) {
                this.businessItemView = (BusinessItemView) itemView;
            }
        }

        public int getViewType() {
            return viewType;
        }

        public BusinessItemView getBusinessItemView() {
            return businessItemView;
        }
    }

    public void setOnItemClickListener(BusinessItemQueueView.OnItemClickListener listener) {
        this.onItemClickListener = listener;
    }

}
