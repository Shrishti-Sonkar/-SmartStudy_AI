export const syllabusData = {
    "subjects": {
        "Physics": {
            "topics": [
                {
                    "name": "Kinematics",
                    "subtopics": [
                        {
                            "name": "Motion in One Dimension",
                            "keywords": [
                                "velocity",
                                "acceleration",
                                "displacement",
                                "speed",
                                "position",
                                "time",
                                "graphs"
                            ],
                            "prerequisites": [],
                            "bloom_level": 2,
                            "estimated_hours": 4
                        },
                        {
                            "name": "Vectors",
                            "keywords": [
                                "magnitude",
                                "direction",
                                "component",
                                "scalar",
                                "unit vector"
                            ],
                            "prerequisites": [
                                "Motion in One Dimension"
                            ],
                            "bloom_level": 3,
                            "estimated_hours": 3
                        },
                        {
                            "name": "Projectile Motion",
                            "keywords": [
                                "trajectory",
                                "range",
                                "height",
                                "parabola"
                            ],
                            "prerequisites": [
                                "Motion in One Dimension",
                                "Vectors"
                            ],
                            "bloom_level": 4,
                            "estimated_hours": 5
                        }
                    ]
                },
                {
                    "name": "Dynamics",
                    "subtopics": [
                        {
                            "name": "Newton's Laws",
                            "keywords": [
                                "force",
                                "mass",
                                "inertia",
                                "action",
                                "reaction",
                                "F=ma"
                            ],
                            "prerequisites": [
                                "Kinematics"
                            ],
                            "bloom_level": 3,
                            "estimated_hours": 4
                        },
                        {
                            "name": "Friction",
                            "keywords": [
                                "static",
                                "kinetic",
                                "coefficient",
                                "normal force"
                            ],
                            "prerequisites": [
                                "Newton's Laws"
                            ],
                            "bloom_level": 4,
                            "estimated_hours": 2
                        },
                        {
                            "name": "Circular Motion",
                            "keywords": [
                                "centripetal",
                                "centrifugal",
                                "radius",
                                "period"
                            ],
                            "prerequisites": [
                                "Newton's Laws",
                                "Vectors"
                            ],
                            "bloom_level": 4,
                            "estimated_hours": 3
                        }
                    ]
                },
                {
                    "name": "Energy",
                    "subtopics": [
                        {
                            "name": "Work and Kinetic Energy",
                            "keywords": [
                                "joule",
                                "work-energy theorem",
                                "dot product"
                            ],
                            "prerequisites": [
                                "Newton's Laws",
                                "Vectors"
                            ],
                            "bloom_level": 3,
                            "estimated_hours": 3
                        },
                        {
                            "name": "Potential Energy",
                            "keywords": [
                                "gravitational",
                                "elastic",
                                "conservative force"
                            ],
                            "prerequisites": [
                                "Work and Kinetic Energy"
                            ],
                            "bloom_level": 3,
                            "estimated_hours": 2
                        },
                        {
                            "name": "Conservation of Energy",
                            "keywords": [
                                "isolated system",
                                "mechanical energy"
                            ],
                            "prerequisites": [
                                "Potential Energy"
                            ],
                            "bloom_level": 5,
                            "estimated_hours": 4
                        }
                    ]
                }
            ]
        },
        "Mathematics": {
            "topics": [
                {
                    "name": "Calculus",
                    "subtopics": [
                        {
                            "name": "Limits",
                            "keywords": [
                                "infinity",
                                "approach",
                                "bound",
                                "continuity"
                            ],
                            "prerequisites": [],
                            "bloom_level": 2,
                            "estimated_hours": 3
                        },
                        {
                            "name": "Derivatives",
                            "keywords": [
                                "slope",
                                "rate of change",
                                "tangent",
                                "power rule"
                            ],
                            "prerequisites": [
                                "Limits"
                            ],
                            "bloom_level": 3,
                            "estimated_hours": 5
                        },
                        {
                            "name": "Chain Rule",
                            "keywords": [
                                "composite function",
                                "inner function",
                                "outer function"
                            ],
                            "prerequisites": [
                                "Derivatives"
                            ],
                            "bloom_level": 4,
                            "estimated_hours": 2
                        },
                        {
                            "name": "Integrals",
                            "keywords": [
                                "area",
                                "volume",
                                "antiderivative",
                                "Riemann sum"
                            ],
                            "prerequisites": [
                                "Derivatives"
                            ],
                            "bloom_level": 3,
                            "estimated_hours": 5
                        }
                    ]
                }
            ]
        }
    }
};
