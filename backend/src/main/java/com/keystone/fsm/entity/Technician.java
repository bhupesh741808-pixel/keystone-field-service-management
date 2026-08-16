package com.keystone.fsm.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "technicians")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Technician {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    @Column(name = "employee_code", unique = true, nullable = false)
    private String employeeCode;

    @Column(nullable = false)
    private String specialization;

    @Builder.Default
    private String availability = "AVAILABLE";
}
