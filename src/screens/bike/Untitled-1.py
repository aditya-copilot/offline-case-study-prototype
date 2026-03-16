#!/usr/bin/env python3
"""
Indoor Navigation Beacon Server
Receives beacon data, calculates user position, and provides pathfinding
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Set
from datetime import datetime
from heapq import heappush, heappop
import threading
import json
import math

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5176", "http://127.0.0.1:5176"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Constant customer UUID for this installation
CUSTOMER_UUID = "550e8400-e29b-41d4-a716-446655440000"


@dataclass
class BeaconData:
    """Beacon data structure"""
    beacon_type: str
    uuid: str
    namespace: Optional[str]
    instance: Optional[str]
    major: int
    minor: int
    txPower: int
    rssi: int
    deviceAddress: str
    timestamp: int
    distanceMeters: float
    rawData: str
    receiverDeviceId: str


@dataclass
class ReceiverPosition:
    """Fixed position of a receiver device"""
    receiverId: str
    x: float
    y: float
    z: float = 0.0
    description: str = ""


@dataclass
class NavigationNode:
    """Node in the navigation graph (receiver or waypoint)"""
    nodeId: str
    x: float
    y: float
    z: float = 0.0
    nodeType: str = "receiver"  # receiver, waypoint, destination
    description: str = ""


class NavigationGraph:
    """Graph for indoor navigation with Dijkstra's algorithm"""
    
    def __init__(self):
        self.nodes: Dict[str, NavigationNode] = {}
        self.edges: Dict[str, List[Tuple[str, float]]] = {}  # nodeId -> [(neighborId, weight)]
    
    def add_node(self, node: NavigationNode):
        """Add a node to the navigation graph"""
        self.nodes[node.nodeId] = node
        if node.nodeId not in self.edges:
            self.edges[node.nodeId] = []
    
    def add_edge(self, node1_id: str, node2_id: str, weight: Optional[float] = None):
        """Add bidirectional edge between two nodes"""
        if node1_id not in self.nodes or node2_id not in self.nodes:
            return False
        
        # Calculate Euclidean distance if weight not provided
        if weight is None:
            n1, n2 = self.nodes[node1_id], self.nodes[node2_id]
            weight = math.sqrt((n1.x - n2.x)**2 + (n1.y - n2.y)**2)
        
        # Add bidirectional edges
        if node2_id not in [e[0] for e in self.edges.get(node1_id, [])]:
            self.edges[node1_id].append((node2_id, weight))
        if node1_id not in [e[0] for e in self.edges.get(node2_id, [])]:
            self.edges[node2_id].append((node1_id, weight))
        
        return True
    
    def remove_edge(self, node1_id: str, node2_id: str):
        """Remove edge between two nodes"""
        self.edges[node1_id] = [(n, w) for n, w in self.edges.get(node1_id, []) if n != node2_id]
        self.edges[node2_id] = [(n, w) for n, w in self.edges.get(node2_id, []) if n != node1_id]
    
    def dijkstra(self, start_id: str, end_id: str) -> Optional[Dict]:
        """
        Find shortest path using Dijkstra's algorithm
        Returns path and total distance
        """
        if start_id not in self.nodes or end_id not in self.nodes:
            return None
        
        # Priority queue: (distance, node_id, path)
        pq = [(0.0, start_id, [start_id])]
        visited: Set[str] = set()
        distances: Dict[str, float] = {start_id: 0}
        
        while pq:
            current_dist, current_id, path = heappop(pq)
            
            if current_id in visited:
                continue
            
            visited.add(current_id)
            
            if current_id == end_id:
                return {
                    'path': path,
                    'totalDistance': round(current_dist, 2),
                    'nodeCount': len(path)
                }
            
            # Explore neighbors
            for neighbor_id, edge_weight in self.edges.get(current_id, []):
                if neighbor_id in visited:
                    continue
                
                new_dist = current_dist + edge_weight
                
                if neighbor_id not in distances or new_dist < distances[neighbor_id]:
                    distances[neighbor_id] = new_dist
                    new_path = path + [neighbor_id]
                    heappush(pq, (new_dist, neighbor_id, new_path))
        
        return None  # No path found
    
    def find_path_to_nearest(self, start_id: str, targets: List[str]) -> Optional[Dict]:
        """Find shortest path to nearest target from list"""
        best_path = None
        best_distance = float('inf')
        
        for target_id in targets:
            result = self.dijkstra(start_id, target_id)
            if result and result['totalDistance'] < best_distance:
                best_distance = result['totalDistance']
                best_path = result
                best_path['target'] = target_id
        
        return best_path
    
    def get_all_nodes(self) -> List[Dict]:
        """Get all nodes in the graph"""
        return [
            {
                'nodeId': node.nodeId,
                'x': node.x,
                'y': node.y,
                'z': node.z,
                'type': node.nodeType,
                'description': node.description
            }
            for node in self.nodes.values()
        ]
    
    def get_edges(self) -> List[Dict]:
        """Get all edges in the graph"""
        edges_list = []
        seen = set()
        
        for node_id, connections in self.edges.items():
            for neighbor_id, weight in connections:
                edge_key = tuple(sorted([node_id, neighbor_id]))
                if edge_key not in seen:
                    seen.add(edge_key)
                    edges_list.append({
                        'from': node_id,
                        'to': neighbor_id,
                        'weight': round(weight, 2)
                    })
        
        return edges_list


class BeaconStore:
    """Thread-safe storage for beacon data from multiple receivers"""
    
    def __init__(self):
        self._lock = threading.Lock()
        self._beacons: Dict[str, Dict[str, BeaconData]] = {}
        self._receiver_history: Dict[str, List[Dict]] = {}
        self._receiver_positions: Dict[str, ReceiverPosition] = {}
        self._nav_graph = NavigationGraph()
    
    def set_receiver_position(self, position: ReceiverPosition):
        """Set fixed coordinates for a receiver and add to navigation graph"""
        with self._lock:
            self._receiver_positions[position.receiverId] = position
            # Add receiver as navigation node
            node = NavigationNode(
                nodeId=position.receiverId,
                x=position.x,
                y=position.y,
                z=position.z,
                nodeType="receiver",
                description=position.description
            )
            self._nav_graph.add_node(node)
    
    def add_navigation_node(self, node: NavigationNode):
        """Add a waypoint or destination node"""
        with self._lock:
            self._nav_graph.add_node(node)
    
    def add_navigation_edge(self, node1_id: str, node2_id: str, weight: Optional[float] = None):
        """Add connection between navigation nodes"""
        with self._lock:
            return self._nav_graph.add_edge(node1_id, node2_id, weight)
    
    def get_receiver_position(self, receiver_id: str) -> Optional[ReceiverPosition]:
        """Get coordinates for a receiver"""
        with self._lock:
            return self._receiver_positions.get(receiver_id)
    
    def get_all_receiver_positions(self) -> Dict[str, ReceiverPosition]:
        """Get all receiver positions"""
        with self._lock:
            return self._receiver_positions.copy()
    
    def update_beacon(self, beacon_data: BeaconData):
        """Update beacon data for a specific receiver device"""
        with self._lock:
            uuid = beacon_data.uuid
            receiver_id = beacon_data.receiverDeviceId
            
            if uuid not in self._beacons:
                self._beacons[uuid] = {}
            
            self._beacons[uuid][receiver_id] = beacon_data
            
            if receiver_id not in self._receiver_history:
                self._receiver_history[receiver_id] = []
            
            self._receiver_history[receiver_id].append({
                'uuid': uuid,
                'distanceMeters': beacon_data.distanceMeters,
                'timestamp': beacon_data.timestamp,
                'rssi': beacon_data.rssi
            })
            
            if len(self._receiver_history[receiver_id]) > 100:
                self._receiver_history[receiver_id] = self._receiver_history[receiver_id][-100:]
    
    def get_beacon_distances(self, uuid: str) -> Dict[str, float]:
        """Get current distances for a beacon from all receivers"""
        with self._lock:
            if uuid not in self._beacons:
                return {}
            return {
                receiver_id: data.distanceMeters 
                for receiver_id, data in self._beacons[uuid].items()
            }
    
    def get_all_beacons(self) -> Dict:
        """Get all beacon data with distances from all receivers"""
        with self._lock:
            result = {}
            for uuid, receivers in self._beacons.items():
                result[uuid] = {
                    receiver_id: {
                        'distanceMeters': data.distanceMeters,
                        'rssi': data.rssi,
                        'timestamp': data.timestamp,
                        'receiverDeviceId': data.receiverDeviceId
                    }
                    for receiver_id, data in receivers.items()
                }
            return result
    
    def get_nearest_receiver(self, uuid: str) -> Optional[Dict]:
        """Get the nearest receiver for a beacon (smallest distance)"""
        with self._lock:
            if uuid not in self._beacons or not self._beacons[uuid]:
                return None
            
            receivers = self._beacons[uuid]
            nearest_receiver = min(receivers.items(), key=lambda x: x[1].distanceMeters)
            receiver_id, data = nearest_receiver
            
            return {
                'receiverDeviceId': receiver_id,
                'distanceMeters': data.distanceMeters,
                'rssi': data.rssi,
                'timestamp': data.timestamp
            }
    
    def get_receiver_stats(self, receiver_id: str) -> Optional[List[Dict]]:
        """Get historical data for a specific receiver"""
        with self._lock:
            return self._receiver_history.get(receiver_id, [])
    
    def calculate_user_position(self, uuid: str) -> Optional[Dict]:
        """Calculate user position using trilateration"""
        with self._lock:
            if uuid not in self._beacons:
                return None
            
            receivers_with_positions = []
            for receiver_id, beacon_data in self._beacons[uuid].items():
                if receiver_id in self._receiver_positions:
                    pos = self._receiver_positions[receiver_id]
                    receivers_with_positions.append({
                        'receiverId': receiver_id,
                        'x': pos.x,
                        'y': pos.y,
                        'z': pos.z,
                        'distance': beacon_data.distanceMeters
                    })
            
            if len(receivers_with_positions) < 3:
                return {
                    'error': f'Need at least 3 receivers with known positions. Found: {len(receivers_with_positions)}',
                    'receivers_found': len(receivers_with_positions)
                }
            
            return self._trilaterate_2d(receivers_with_positions)
    
    def _trilaterate_2d(self, receivers: List[Dict]) -> Dict:
        """Calculate 2D position using trilateration"""
        if len(receivers) == 3:
            return self._trilaterate_exact_2d(receivers[:3])
        else:
            return self._trilaterate_least_squares_2d(receivers)
    
    def _trilaterate_exact_2d(self, receivers: List[Dict]) -> Dict:
        """Exact solution for 3 receivers"""
        r1, r2, r3 = receivers[0], receivers[1], receivers[2]
        x1, y1, d1 = r1['x'], r1['y'], r1['distance']
        x2, y2, d2 = r2['x'], r2['y'], r2['distance']
        x3, y3, d3 = r3['x'], r3['y'], r3['distance']
        
        A = 2 * (x2 - x1)
        B = 2 * (y2 - y1)
        C = d1**2 - d2**2 - x1**2 + x2**2 - y1**2 + y2**2
        
        D = 2 * (x3 - x1)
        E = 2 * (y3 - y1)
        F = d1**2 - d3**2 - x1**2 + x3**2 - y1**2 + y3**2
        
        determinant = A * E - B * D
        
        if abs(determinant) < 1e-10:
            return self._trilaterate_least_squares_2d(receivers)
        
        x = (C * E - B * F) / determinant
        y = (A * F - C * D) / determinant
        
        residuals = []
        for r in receivers:
            calculated_distance = math.sqrt((x - r['x'])**2 + (y - r['y'])**2)
            residuals.append(abs(calculated_distance - r['distance']))
        
        avg_error = sum(residuals) / len(residuals)
        
        return {
            'x': round(x, 2),
            'y': round(y, 2),
            'accuracy': round(avg_error, 2),
            'receivers_used': len(receivers),
            'method': 'exact_2d'
        }
    
    def _trilaterate_least_squares_2d(self, receivers: List[Dict]) -> Dict:
        """Least squares solution for 4+ receivers"""
        x = sum(r['x'] for r in receivers) / len(receivers)
        y = sum(r['y'] for r in receivers) / len(receivers)
        
        for _ in range(100):
            A = []
            b = []
            
            for r in receivers:
                dx = x - r['x']
                dy = y - r['y']
                d = math.sqrt(dx**2 + dy**2)
                
                if d < 1e-10:
                    continue
                
                A.append([dx / d, dy / d])
                b.append(r['distance'] - d)
            
            if len(A) < 2:
                break
            
            dx = sum(A[i][0] * b[i] for i in range(len(A))) / len(A)
            dy = sum(A[i][1] * b[i] for i in range(len(A))) / len(A)
            
            x += dx * 0.5
            y += dy * 0.5
            
            if math.sqrt(dx**2 + dy**2) < 1e-6:
                break
        
        residuals = []
        for r in receivers:
            calculated_distance = math.sqrt((x - r['x'])**2 + (y - r['y'])**2)
            residuals.append(abs(calculated_distance - r['distance']))
        
        avg_error = sum(residuals) / len(residuals)
        
        return {
            'x': round(x, 2),
            'y': round(y, 2),
            'accuracy': round(avg_error, 2),
            'receivers_used': len(receivers),
            'method': 'least_squares_2d'
        }
    
    def find_path(self, start_id: str, end_id: str) -> Optional[Dict]:
        """Find shortest path between two nodes using Dijkstra"""
        with self._lock:
            return self._nav_graph.dijkstra(start_id, end_id)
    
    def find_path_to_receiver(self, user_uuid: str, target_receiver_id: str) -> Optional[Dict]:
        """Find path from user position to a specific receiver"""
        # Get user position first (needs lock, so call outside)
        position = self.calculate_user_position(user_uuid)
        
        if not position or 'error' in position:
            return {
                'error': 'Cannot determine user position',
                'details': position.get('error') if position else None
            }
        
        with self._lock:
            # Add temporary user node to graph
            user_node_id = f"USER-{user_uuid[:8]}"
            user_node = NavigationNode(
                nodeId=user_node_id,
                x=position['x'],
                y=position['y'],
                nodeType="user",
                description="Current user position"
            )
            
            # Temporarily add user node
            self._nav_graph.add_node(user_node)
            
            # Connect user to nearest receivers (within reasonable distance)
            for receiver_id, receiver_pos in self._receiver_positions.items():
                dist = math.sqrt((position['x'] - receiver_pos.x)**2 + (position['y'] - receiver_pos.y)**2)
                if dist < 20:  # Connect if within 20 meters
                    self._nav_graph.add_edge(user_node_id, receiver_id, dist)
            
            # Find path
            result = self._nav_graph.dijkstra(user_node_id, target_receiver_id)
            
            # Clean up user node
            if user_node_id in self._nav_graph.nodes:
                del self._nav_graph.nodes[user_node_id]
                del self._nav_graph.edges[user_node_id]
                for edges in self._nav_graph.edges.values():
                    edges[:] = [(n, w) for n, w in edges if n != user_node_id]
            
            if result:
                result['userPosition'] = {
                    'x': position['x'],
                    'y': position['y']
                }
                result['targetReceiver'] = target_receiver_id
            
            return result
    
    def find_path_to_nearest_receiver(self, user_uuid: str) -> Optional[Dict]:
        """Find path to the nearest receiver from user position"""
        with self._lock:
            nearest = self.get_nearest_receiver(user_uuid)
            if not nearest:
                return {'error': 'No receiver data available'}
            
            return self.find_path_to_receiver(user_uuid, nearest['receiverDeviceId'])
    
    def get_navigation_graph_info(self) -> Dict:
        """Get navigation graph structure"""
        with self._lock:
            return {
                'nodes': self._nav_graph.get_all_nodes(),
                'edges': self._nav_graph.get_edges(),
                'totalNodes': len(self._nav_graph.nodes),
                'totalEdges': len(self._nav_graph.get_edges())
            }


# Global beacon store instance
beacon_store = BeaconStore()


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/receiver/position', methods=['POST'])
def set_receiver_position():
    """Set fixed coordinates for a receiver device"""
    try:
        data = request.get_json()
        
        if not data or 'receiverId' not in data or 'x' not in data or 'y' not in data:
            return jsonify({'error': 'Missing required fields: receiverId, x, y'}), 400
        
        position = ReceiverPosition(
            receiverId=data['receiverId'],
            x=float(data['x']),
            y=float(data['y']),
            z=float(data.get('z', 0.0)),
            description=data.get('description', '')
        )
        
        beacon_store.set_receiver_position(position)
        
        return jsonify({
            'status': 'success',
            'message': f'Position set for {position.receiverId}',
            'position': {
                'receiverId': position.receiverId,
                'x': position.x,
                'y': position.y,
                'z': position.z,
                'description': position.description
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/receiver/positions', methods=['GET'])
def get_all_receiver_positions():
    """Get all receiver positions"""
    positions = beacon_store.get_all_receiver_positions()
    
    return jsonify({
        'positions': [
            {
                'receiverId': pos.receiverId,
                'x': pos.x,
                'y': pos.y,
                'z': pos.z,
                'description': pos.description
            }
            for pos in positions.values()
        ],
        'total': len(positions)
    }), 200


@app.route('/navigation/node', methods=['POST'])
def add_navigation_node():
    """Add a navigation node (waypoint/destination)"""
    try:
        data = request.get_json()
        
        if not data or 'nodeId' not in data or 'x' not in data or 'y' not in data:
            return jsonify({'error': 'Missing required fields: nodeId, x, y'}), 400
        
        node = NavigationNode(
            nodeId=data['nodeId'],
            x=float(data['x']),
            y=float(data['y']),
            z=float(data.get('z', 0.0)),
            nodeType=data.get('nodeType', 'waypoint'),
            description=data.get('description', '')
        )
        
        beacon_store.add_navigation_node(node)
        
        return jsonify({
            'status': 'success',
            'message': f'Node {node.nodeId} added',
            'node': {
                'nodeId': node.nodeId,
                'x': node.x,
                'y': node.y,
                'type': node.nodeType,
                'description': node.description
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/navigation/edge', methods=['POST'])
def add_navigation_edge():
    """Add edge between navigation nodes"""
    try:
        data = request.get_json()
        
        if not data or 'from' not in data or 'to' not in data:
            return jsonify({'error': 'Missing required fields: from, to'}), 400
        
        weight = data.get('weight')
        if weight is not None:
            weight = float(weight)
        
        success = beacon_store.add_navigation_edge(data['from'], data['to'], weight)
        
        if success:
            return jsonify({
                'status': 'success',
                'message': f'Edge added between {data["from"]} and {data["to"]}'
            }), 200
        else:
            return jsonify({
                'error': 'One or both nodes not found'
            }), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/navigation/graph', methods=['GET'])
def get_navigation_graph():
    """Get full navigation graph structure"""
    graph_info = beacon_store.get_navigation_graph_info()
    return jsonify(graph_info), 200


@app.route('/navigation/path', methods=['POST'])
def find_path():
    """Find shortest path between two nodes using Dijkstra"""
    try:
        data = request.get_json()
        
        if not data or 'from' not in data or 'to' not in data:
            return jsonify({'error': 'Missing required fields: from, to'}), 400
        
        result = beacon_store.find_path(data['from'], data['to'])
        
        if result:
            return jsonify({
                'status': 'success',
                'path': result['path'],
                'totalDistance': result['totalDistance'],
                'nodeCount': result['nodeCount']
            }), 200
        else:
            return jsonify({
                'error': 'No path found between nodes'
            }), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/beacon/data', methods=['POST'])
def receive_beacon_data():
    """Receive beacon data from receiver devices - uses constant customer UUID"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Use constant customer UUID
        data['uuid'] = CUSTOMER_UUID
        
        required_fields = ['type', 'major', 'minor', 'txPower', 
                          'rssi', 'deviceAddress', 'timestamp', 
                          'distanceMeters', 'rawData', 'receiverDeviceId']
        
        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing': missing_fields
            }), 400
        
        beacon_data = BeaconData(
            beacon_type=data['type'],
            uuid=CUSTOMER_UUID,
            namespace=data.get('namespace'),
            instance=data.get('instance'),
            major=data['major'],
            minor=data['minor'],
            txPower=data['txPower'],
            rssi=data['rssi'],
            deviceAddress=data['deviceAddress'],
            timestamp=data['timestamp'],
            distanceMeters=data['distanceMeters'],
            rawData=data['rawData'],
            receiverDeviceId=data['receiverDeviceId']
        )
        
        beacon_store.update_beacon(beacon_data)
        
        return jsonify({
            'status': 'success',
            'message': f'Beacon data received from {beacon_data.receiverDeviceId}',
            'customerUuid': CUSTOMER_UUID,
            'distanceMeters': beacon_data.distanceMeters,
            'receiverDeviceId': beacon_data.receiverDeviceId,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/beacon/distances', methods=['GET'])
def get_customer_distances():
    """Get current distances from all receivers for the constant customer UUID"""
    distances = beacon_store.get_beacon_distances(CUSTOMER_UUID)
    
    if not distances:
        return jsonify({'error': 'No data found for customer'}), 404
    
    return jsonify({
        'customerUuid': CUSTOMER_UUID,
        'distances': distances,
        'receiver_count': len(distances),
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/beacon/position', methods=['GET'])
def get_customer_position():
    """Calculate customer position using trilateration"""
    try:
        position = beacon_store.calculate_user_position(CUSTOMER_UUID)
        
        if not position:
            return jsonify({'error': 'No beacon data found for customer'}), 404
        
        if 'error' in position:
            return jsonify({
                'customerUuid': CUSTOMER_UUID,
                'error': position['error'],
                'receivers_found': position.get('receivers_found', 0),
                'timestamp': datetime.now().isoformat()
            }), 400
        
        return jsonify({
            'customerUuid': CUSTOMER_UUID,
            'position': {
                'x': position['x'],
                'y': position['y'],
                'unit': 'meters'
            },
            'accuracy': position['accuracy'],
            'receivers_used': position['receivers_used'],
            'method': position['method'],
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/navigation/route/to-receiver/<receiver_id>', methods=['GET'])
def navigate_customer_to_receiver(receiver_id):
    """
    Navigate customer to a specific receiver
    Uses Dijkstra's algorithm to find shortest path
    """
    try:
        result = beacon_store.find_path_to_receiver(CUSTOMER_UUID, receiver_id)
        
        if not result:
            return jsonify({'error': 'Cannot calculate route'}), 500
        
        if 'error' in result:
            return jsonify({
                'error': result['error'],
                'details': result.get('details')
            }), 400
        
        return jsonify({
            'status': 'success',
            'customerUuid': CUSTOMER_UUID,
            'userPosition': result['userPosition'],
            'targetReceiver': result['targetReceiver'],
            'path': result['path'],
            'pathDetails': [
                {
                    'nodeId': node_id,
                    'position': beacon_store._nav_graph.nodes.get(node_id, NavigationNode(nodeId=node_id, x=0, y=0)).__dict__
                }
                for node_id in result['path']
            ],
            'totalDistance': result['totalDistance'],
            'nodeCount': result['nodeCount'],
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/navigation/route/to-nearest', methods=['GET'])
def navigate_customer_to_nearest():
    """Navigate customer to the nearest receiver"""
    try:
        result = beacon_store.find_path_to_nearest_receiver(CUSTOMER_UUID)
        
        if not result:
            return jsonify({'error': 'Cannot calculate route'}), 500
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 400
        
        return jsonify({
            'status': 'success',
            'customerUuid': CUSTOMER_UUID,
            'userPosition': result['userPosition'],
            'targetReceiver': result['targetReceiver'],
            'path': result['path'],
            'totalDistance': result['totalDistance'],
            'nodeCount': result['nodeCount'],
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/beacon/nearest', methods=['GET', 'OPTIONS'])
def get_customer_nearest_receiver():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'OK'}), 200

    """Get the nearest receiver for the customer"""
    nearest = beacon_store.get_nearest_receiver(CUSTOMER_UUID)
    
    if not nearest:
        return jsonify({'error': 'No data found for customer'}), 404
    
    return jsonify({
        'customerUuid': CUSTOMER_UUID,
        'nearestReceiver': nearest['receiverDeviceId'],
        'distanceMeters': nearest['distanceMeters'],
        'rssi': nearest['rssi'],
        'timestamp': datetime.now().isoformat()
    }), 200


# Legacy endpoints with UUID parameter (for backward compatibility)
@app.route('/beacon/distances/<uuid>', methods=['GET'])
def get_beacon_distances(uuid):
    """Get current distances from all receivers for a specific beacon (legacy)"""
    distances = beacon_store.get_beacon_distances(uuid)
    
    if not distances:
        return jsonify({'error': 'No data found for this beacon'}), 404
    
    return jsonify({
        'uuid': uuid,
        'distances': distances,
        'receiver_count': len(distances),
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/beacon/position/<uuid>', methods=['GET'])
def get_user_position(uuid):
    """Calculate user position using trilateration (legacy)"""
    try:
        position = beacon_store.calculate_user_position(uuid)
        
        if not position:
            return jsonify({'error': 'No beacon data found'}), 404
        
        if 'error' in position:
            return jsonify({
                'uuid': uuid,
                'error': position['error'],
                'receivers_found': position.get('receivers_found', 0),
                'timestamp': datetime.now().isoformat()
            }), 400
        
        return jsonify({
            'uuid': uuid,
            'position': {
                'x': position['x'],
                'y': position['y'],
                'unit': 'meters'
            },
            'accuracy': position['accuracy'],
            'receivers_used': position['receivers_used'],
            'method': position['method'],
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/navigation/route/to-receiver/<user_uuid>/<receiver_id>', methods=['GET'])
def navigate_to_receiver(user_uuid, receiver_id):
    """
    Navigate from user's current position to a specific receiver (legacy)
    """
    try:
        result = beacon_store.find_path_to_receiver(user_uuid, receiver_id)
        
        if not result:
            return jsonify({'error': 'Cannot calculate route'}), 500
        
        if 'error' in result:
            return jsonify({
                'error': result['error'],
                'details': result.get('details')
            }), 400
        
        return jsonify({
            'status': 'success',
            'userPosition': result['userPosition'],
            'targetReceiver': result['targetReceiver'],
            'path': result['path'],
            'totalDistance': result['totalDistance'],
            'nodeCount': result['nodeCount'],
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/navigation/route/to-nearest/<user_uuid>', methods=['GET'])
def navigate_to_nearest_receiver(user_uuid):
    """
    Navigate from user's current position to the nearest receiver
    """
    try:
        result = beacon_store.find_path_to_nearest_receiver(user_uuid)
        
        if not result:
            return jsonify({'error': 'Cannot calculate route'}), 500
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 400
        
        return jsonify({
            'status': 'success',
            'userPosition': result['userPosition'],
            'targetReceiver': result['targetReceiver'],
            'path': result['path'],
            'totalDistance': result['totalDistance'],
            'nodeCount': result['nodeCount'],
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/beacon/nearest/<uuid>', methods=['GET'])
def get_nearest_receiver(uuid):
    """Get the nearest receiver for a beacon"""
    nearest = beacon_store.get_nearest_receiver(uuid)
    
    if not nearest:
        return jsonify({'error': 'No data found for this beacon'}), 404
    
    return jsonify({
        'uuid': uuid,
        'nearestReceiver': nearest['receiverDeviceId'],
        'distanceMeters': nearest['distanceMeters'],
        'rssi': nearest['rssi'],
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/beacon/all', methods=['GET'])
def get_all_beacons():
    """Get all beacons and their distances"""
    all_beacons = beacon_store.get_all_beacons()
    
    return jsonify({
        'beacons': all_beacons,
        'total_beacons': len(all_beacons),
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/receiver/<receiver_id>/history', methods=['GET'])
def get_receiver_history(receiver_id):
    """Get historical beacon data for a specific receiver"""
    history = beacon_store.get_receiver_stats(receiver_id)
    
    if not history:
        return jsonify({'error': 'No history found for this receiver'}), 404
    
    return jsonify({
        'receiverDeviceId': receiver_id,
        'history': history,
        'record_count': len(history)
    }), 200


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    }), 200


if __name__ == '__main__':
    print("=" * 70)
    print("INDOOR NAVIGATION SERVER WITH DIJKSTRA PATHFINDING")
    print("=" * 70)
    print("\nEndpoints:")
    print("  POST /receiver/position              - Set receiver coordinates")
    print("  GET  /receiver/positions             - Get all receiver positions")
    print("  POST /navigation/node                - Add waypoint/destination")
    print("  POST /navigation/edge                - Connect nodes")
    print("  GET  /navigation/graph               - View navigation graph")
    print("  POST /navigation/path                - Find path (Dijkstra)")
    print("  POST /beacon/data                    - Receive beacon data")
    print("  GET  /beacon/position/<uuid>         - Calculate user position")
    print("  GET  /navigation/route/to-nearest/<uuid>     - Route to nearest")
    print("  GET  /navigation/route/to-receiver/<uuid>/<id> - Route to specific")
    print("\nServer running on http://0.0.0.0:8080")
    print("=" * 70)
    
    app.run(host='0.0.0.0', port=8080, debug=True)
