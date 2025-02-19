import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from '../eventemitter';

describe('EventEmitter', () => {
    let emitter: EventEmitter;

    beforeEach(() => {
        emitter = new EventEmitter();
    });

    it('should register and trigger event listeners', () => {
        const mockListener = vi.fn();
        emitter.on('test', mockListener);
        emitter.emit('test', 'data');
        expect(mockListener).toHaveBeenCalledWith('data');
    });

    it('should handle multiple listeners for same event', () => {
        const mockListener1 = vi.fn();
        const mockListener2 = vi.fn();
        
        emitter.on('test', mockListener1);
        emitter.on('test', mockListener2);
        
        emitter.emit('test', 'data');
        
        expect(mockListener1).toHaveBeenCalledWith('data');
        expect(mockListener2).toHaveBeenCalledWith('data');
    });

    it('should remove specific listener', () => {
        const mockListener1 = vi.fn();
        const mockListener2 = vi.fn();
        
        emitter.on('test', mockListener1);
        emitter.on('test', mockListener2);
        emitter.off('test', mockListener1);
        
        emitter.emit('test', 'data');
        
        expect(mockListener1).not.toHaveBeenCalled();
        expect(mockListener2).toHaveBeenCalledWith('data');
    });

    it('should handle non-existent events gracefully', () => {
        expect(() => {
            emitter.emit('nonexistent', 'data');
        }).not.toThrow();
    });

    it('should handle multiple arguments in emit', () => {
        const mockListener = vi.fn();
        emitter.on('test', mockListener);
        emitter.emit('test', 'data1', 'data2');
        expect(mockListener).toHaveBeenCalledWith('data1', 'data2');
    });
});