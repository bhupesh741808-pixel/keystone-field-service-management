package com.keystone.fsm.repository;

import com.keystone.fsm.entity.WorkOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
    Optional<WorkOrder> findByWorkOrderNumber(String workOrderNumber);
    
    Page<WorkOrder> findByCustomerId(Long customerId, Pageable pageable);
    
    Page<WorkOrder> findByAssignedToId(Long assignedToId, Pageable pageable);

    List<WorkOrder> findByAssignedToId(Long assignedToId);

    @Query("SELECT w FROM WorkOrder w WHERE " +
           "(:status IS NULL OR w.status = :status) AND " +
           "(:priority IS NULL OR w.priority = :priority) AND " +
           "(:assignedToId IS NULL OR w.assignedTo.id = :assignedToId) AND " +
           "(:customerId IS NULL OR w.customer.id = :customerId) AND " +
           "(:search IS NULL OR LOWER(w.workOrderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(w.customer.companyName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<WorkOrder> searchWorkOrders(
            @Param("status") String status,
            @Param("priority") String priority,
            @Param("assignedToId") Long assignedToId,
            @Param("customerId") Long customerId,
            @Param("search") String search,
            Pageable pageable);
}
