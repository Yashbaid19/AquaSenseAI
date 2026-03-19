import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta, timezone
import random


class YieldPredictionModel:
    """Machine Learning model for crop yield prediction"""
    
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self._train_initial_model()
    
    def _train_initial_model(self):
        """Train model with synthetic data for demo"""
        # Generate synthetic training data
        # Features: avg_soil_moisture, irrigation_frequency, temperature, rainfall
        X_train = np.array([
            [35, 3, 28, 50],
            [30, 4, 30, 40],
            [40, 2, 25, 60],
            [25, 5, 32, 30],
            [38, 3, 27, 55],
            [28, 4, 29, 45],
            [42, 2, 26, 65],
            [33, 3, 28, 50],
            [36, 3, 27, 52],
            [31, 4, 29, 48],
        ])
        
        # Target: yield in kg/acre
        y_train = np.array([450, 420, 480, 380, 470, 410, 490, 440, 460, 430])
        
        self.model.fit(X_train, y_train)
    
    def predict_yield(self, sensor_data, irrigation_logs, weather_data):
        """Predict crop yield based on historical data"""
        # Calculate features from historical data
        avg_soil_moisture = np.mean([s.get('soil_moisture', 30) for s in sensor_data[-30:]])
        irrigation_frequency = len(irrigation_logs[-30:])
        avg_temperature = np.mean([s.get('temperature', 28) for s in sensor_data[-30:]])
        rainfall = weather_data.get('rainfall', 50)
        
        # Predict
        features = np.array([[avg_soil_moisture, irrigation_frequency, avg_temperature, rainfall]])
        predicted_yield = self.model.predict(features)[0]
        
        # Calculate baseline (optimal conditions)
        baseline_features = np.array([[35, 3, 28, 50]])
        baseline_yield = self.model.predict(baseline_features)[0]
        
        # Calculate improvement percentage
        improvement = ((predicted_yield - baseline_yield) / baseline_yield) * 100
        
        return {
            'predicted_yield': round(predicted_yield, 2),
            'baseline_yield': round(baseline_yield, 2),
            'improvement_percentage': round(improvement, 2),
            'confidence': random.uniform(75, 95)  # Simulated confidence score
        }
    
    def analyze_irrigation_patterns(self, irrigation_logs):
        """Analyze irrigation patterns and provide insights"""
        if not irrigation_logs:
            return {
                'pattern': 'insufficient_data',
                'frequency': 0,
                'optimization_score': 0,
                'insights': []
            }
        
        # Calculate irrigation frequency
        frequency = len(irrigation_logs)
        
        # Determine pattern
        optimal_frequency = 15  # Optimal irrigations per month
        
        if frequency > optimal_frequency * 1.2:
            pattern = 'over_irrigation'
            optimization_score = 65
            insights = [
                f"Irrigation frequency is {round((frequency/optimal_frequency - 1) * 100)}% higher than optimal",
                "Consider reducing irrigation frequency to save water",
                "Monitor soil moisture more closely before irrigating"
            ]
        elif frequency < optimal_frequency * 0.8:
            pattern = 'under_irrigation'
            optimization_score = 70
            insights = [
                f"Irrigation frequency is {round((1 - frequency/optimal_frequency) * 100)}% lower than optimal",
                "Crops may be experiencing water stress",
                "Consider increasing irrigation frequency"
            ]
        else:
            pattern = 'optimal'
            optimization_score = 88
            insights = [
                "Irrigation pattern is within optimal range",
                "Continue monitoring sensor data for adjustments",
                "Water usage efficiency is good"
            ]
        
        return {
            'pattern': pattern,
            'frequency': frequency,
            'optimal_frequency': optimal_frequency,
            'optimization_score': optimization_score,
            'insights': insights
        }
    
    def calculate_water_efficiency(self, analytics_data):
        """Calculate comprehensive water efficiency metrics"""
        if not analytics_data:
            return {'efficiency_score': 0, 'sustainability_rating': 'Unknown'}
        
        # Calculate average efficiency
        efficiencies = [a.get('efficiency', 0) for a in analytics_data]
        avg_efficiency = np.mean(efficiencies) if efficiencies else 0
        
        # Calculate water savings ratio
        total_water_used = sum([a.get('water_used', 0) for a in analytics_data])
        total_water_saved = sum([a.get('water_saved', 0) for a in analytics_data])
        
        if total_water_used > 0:
            savings_ratio = (total_water_saved / (total_water_used + total_water_saved)) * 100
        else:
            savings_ratio = 0
        
        # Overall efficiency score (weighted)
        efficiency_score = (avg_efficiency * 0.6 + savings_ratio * 0.4)
        
        # Sustainability rating
        if efficiency_score >= 85:
            sustainability_rating = 'Excellent'
        elif efficiency_score >= 75:
            sustainability_rating = 'Good'
        elif efficiency_score >= 65:
            sustainability_rating = 'Fair'
        else:
            sustainability_rating = 'Needs Improvement'
        
        return {
            'efficiency_score': round(efficiency_score, 1),
            'water_efficiency': round(avg_efficiency, 1),
            'water_savings_ratio': round(savings_ratio, 1),
            'sustainability_rating': sustainability_rating,
            'total_water_saved': round(total_water_saved, 2),
            'total_water_used': round(total_water_used, 2)
        }


# Global ML model instance
ml_model = YieldPredictionModel()
